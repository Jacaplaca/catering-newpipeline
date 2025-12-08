import { env } from '@root/app/env';
import { getSetting } from '@root/app/server/cache/settings';
import { db } from '@root/app/server/db';
import getCutoffDate from '@root/app/server/lib/cutoffDate';
import cron from 'node-cron';
import logger from '@root/app/lib/logger';

const isProduction = env.NODE_ENV === 'production';

async function cleanupMenu() {
        logger.info('>>>>>>>>>>>>>>>>>>Menu cleanup process started');
        const oldMonths = await getSetting<number>('cleanup', 'menu-old-months');

        if (oldMonths == null || oldMonths < 0) {
                return;
        }

        const { cutoffYear, cutoffMonth } = getCutoffDate({ months: oldMonths });

        try {
                const oldMenusResult = await db.regularMenu.aggregateRaw({
                        pipeline: [
                                {
                                        $match: {
                                                $or: [
                                                        {
                                                                "day.year": { $lt: cutoffYear }
                                                        },
                                                        {
                                                                $and: [
                                                                        { "day.year": cutoffYear },
                                                                        { "day.month": { $lt: cutoffMonth } }
                                                                ]
                                                        }
                                                ]
                                        }
                                },
                                {
                                        $project: {
                                                id: "$_id",
                                                day: 1,
                                                clientId: 1,
                                                cateringId: 1
                                        }
                                }
                        ]
                });

                const oldMenus = oldMenusResult as unknown as Array<{
                        id: string;
                        day: { year: number; month: number; day: number };
                        clientId: string;
                        cateringId: string;
                }>;

                if (oldMenus.length === 0) {
                        return;
                }

                const menuIds = oldMenus.map(menu => menu.id);

                // Delete old regular menus - cascade will automatically delete all related records:
                // - MenuMealFood (onDelete: Cascade)
                // - ConsumerFood (onDelete: Cascade) 
                // - ConsumerFoodExclusion (onDelete: Cascade via ConsumerFood)
                await db.regularMenu.deleteMany({
                        where: {
                                id: {
                                        in: menuIds
                                }
                        }
                });

                logger.info(`Menu cleanup: cutoff ${cutoffYear}-${cutoffMonth + 1}, deleted ${oldMenus.length} regular menus`);

        } catch (error) {
                logger.error(`Error during menu cleanup operation: ${error instanceof Error ? error.message : String(error)}`);
        }
}

// Initialize cron job asynchronously
async function initCleanupCron() {
        const cronSchedule = await getSetting<string>('cleanup', 'menu-cron');
        const shouldCleanup = await getSetting<boolean>('cleanup', 'menu-should-delete');
        cron.schedule(cronSchedule, () => {
                if (shouldCleanup && isProduction) {
                        void cleanupMenu();
                }
        });
}

// Start the cron job when module loads
export default initCleanupCron;