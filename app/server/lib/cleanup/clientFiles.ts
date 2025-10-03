import { env } from '@root/app/env';
import { getSetting } from '@root/app/server/cache/settings';
import { db } from '@root/app/server/db';
import getCutoffDate from '@root/app/server/lib/cutoffDate';
import { s3deleteKeys } from '@root/app/server/s3/delete';
import cron from 'node-cron';

const isProduction = env.NODE_ENV === 'production';

async function cleanupClientFiles() {
        console.log('>>>>>>>>>>>>>>>>>>Client files cleanup process started');
        const oldMonths = await getSetting<number>('cleanup', 'client-files-old-months');

        if (oldMonths == null || oldMonths < 0) {
                return;
        }

        const { cutoffDate } = getCutoffDate({ months: oldMonths });

        // Calculate cutoff week from date
        // ISO week date calculation: week 1 is the first week with Thursday in the new year
        const cutoffYear = cutoffDate.getFullYear();
        const startOfYear = new Date(cutoffYear, 0, 1);
        const dayOfYear = Math.floor((cutoffDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;
        const cutoffWeek = Math.ceil(dayOfYear / 7);

        try {
                // Find old client files based on week structure
                const oldClientFilesResult = await db.clientFile.aggregateRaw({
                        pipeline: [
                                {
                                        $match: {
                                                $or: [
                                                        {
                                                                "week.year": { $lt: cutoffYear }
                                                        },
                                                        {
                                                                $and: [
                                                                        { "week.year": cutoffYear },
                                                                        { "week.week": { $lt: cutoffWeek } }
                                                                ]
                                                        }
                                                ]
                                        }
                                },
                                {
                                        $project: {
                                                id: "$_id",
                                                week: 1,
                                                s3Key: 1,
                                                fileName: 1,
                                                fileType: 1,
                                                clientId: 1,
                                                cateringId: 1
                                        }
                                }
                        ]
                });

                const oldClientFiles = oldClientFilesResult as unknown as Array<{
                        id: string;
                        week: { year: number; week: number };
                        s3Key: string;
                        fileName: string;
                        fileType: string;
                        clientId: string;
                        cateringId: string;
                }>;

                if (oldClientFiles.length === 0) {
                        console.log(`ClientFiles cleanup: cutoff ${cutoffYear}-W${cutoffWeek}, no files to delete`);
                        return;
                }

                const clientFileIds = oldClientFiles.map(file => file.id);
                const oldS3Keys = [...new Set(oldClientFiles.map(file => file.s3Key))]; // Remove duplicates

                // Find s3Keys that are safe to delete (not used by remaining files)
                const remainingFilesWithSameS3Keys = await db.clientFile.findMany({
                        where: {
                                s3Key: {
                                        in: oldS3Keys
                                },
                                id: {
                                        notIn: clientFileIds
                                }
                        },
                        select: {
                                s3Key: true
                        }
                });

                const usedS3Keys = new Set(remainingFilesWithSameS3Keys.map(file => file.s3Key));
                const safeToDeleteS3Keys = oldS3Keys.filter(s3Key => !usedS3Keys.has(s3Key));

                console.log(`ClientFiles cleanup: cutoff ${cutoffYear}-W${cutoffWeek}`);
                console.log(`Found ${oldClientFiles.length} client files to delete`);
                console.log(`S3 keys safe to delete: ${safeToDeleteS3Keys.length}`);
                console.log(`S3 keys NOT safe to delete: ${oldS3Keys.length - safeToDeleteS3Keys.length}`);

                // TODO: Delete old client files (commented for safety)
                await db.clientFile.deleteMany({
                        where: {
                                id: {
                                        in: clientFileIds
                                }
                        }
                });
                console.log(`Deleted ${oldClientFiles.length} client files`);

                // Delete safe S3 keys from S3 bucket
                if (safeToDeleteS3Keys.length > 0) {
                        console.log(`Deleting ${safeToDeleteS3Keys.length} files from S3 bucket`);
                        console.log(`Sample S3 keys to delete:`, safeToDeleteS3Keys.slice(0, 5));

                        try {
                                await s3deleteKeys(safeToDeleteS3Keys);
                                console.log(`Successfully deleted ${safeToDeleteS3Keys.length} files from S3`);
                        } catch (error) {
                                console.error('Failed to delete S3 files:', error);
                                console.error('All S3 keys that failed:', safeToDeleteS3Keys);
                                // Don't re-throw - we already deleted the DB records, continue execution
                        }
                } else {
                        console.log('No S3 files to delete');
                }

        } catch (error) {
                console.error('Error during client files cleanup operation:', error);
        }
}

// Initialize cron job asynchronously
async function initCleanupCron() {
        const cronSchedule = await getSetting<string>('cleanup', 'client-files-cron');
        const shouldCleanup = await getSetting<boolean>('cleanup', 'client-files-should-delete');
        cron.schedule(cronSchedule, () => {
                if (shouldCleanup && isProduction) {
                        void cleanupClientFiles();
                }
        });
}

// Start the cron job when module loads
export default initCleanupCron;