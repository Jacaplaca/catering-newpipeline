import { env } from '@root/app/env';
import { exec } from 'child_process';
import path from 'path';
import cron from 'node-cron';
import uploadFile from '@root/app/server/lib/makeBackup/upload';
import db2Archive from '@root/app/server/lib/makeBackup/db2Archive';
import getSafeDate from '@root/app/lib/date/safeDate';
import { getSetting } from '@root/app/server/cache/settings';

const isProduction = env.NODE_ENV === 'production';
// const backup_cron = env.BACKUP_CRON;
// const filesToKeep = parseInt(env.BACKUP_KEEP);
const dumpDir = isProduction ? 'dump' : 'app/assets/db/dump';
const backupsDir = isProduction ? 'backups' : 'app/assets/db/backups';
const s3prefixDaily = isProduction ? 'backups/prod/daily' : 'backups/dev/daily';
const s3prefixMonthly = isProduction ? 'backups/prod/monthly' : 'backups/dev/monthly';
const dumpFileName = 'dump.tar.gz';
const dumpContentType = 'application/gzip';

async function dbBackup() {
    console.log('>>>>>>>>>>>>>>>>>>Backup process started');
    const filesToKeep = await getSetting<number>('backup', 'daily-files-to-keep');
    const fileNameDaily = `db_daily_${env.APP_NAME}_${getSafeDate({ minUnit: 'day' })}.tar.gz`;
    const fileNameMonthly = `db_monthly_${env.APP_NAME}_${getSafeDate({ minUnit: 'month' })}.tar.gz`;

    if (!isProduction) {
        await db2Archive({ fileName: dumpFileName, backupsDir, dumpDir });
        await uploadFile({ dumpFileName, fileName: fileNameDaily, backupsDir, prefix: s3prefixDaily, filesToKeep, contentType: dumpContentType });
        await uploadFile({ dumpFileName, fileName: fileNameMonthly, backupsDir, prefix: s3prefixMonthly, contentType: dumpContentType });
        return fileNameDaily;
    }

    const dbUrl = env.DATABASE_URL;
    const mongodumpCommand = `mongodump --uri=${dbUrl}`;
    const backupPath = path.join(backupsDir, dumpFileName);
    const tarCommand = `tar -czvf ${backupPath} ${dumpDir}`;
    const clearBackupsDirCommand = `rm -rf ${backupsDir}/*`;
    const clearDumpDirCommand = `rm -rf ${dumpDir}/*`;

    isProduction && exec(clearBackupsDirCommand, (clearBackupError, clearBackupStdout, clearBackupStderr) => {
        if (clearBackupError) {
            console.error(`Error clearing backupsDir: ${clearBackupError.message}`);
            return;
        }

        if (clearBackupStderr) {
            console.error(`Error clearing backupsDir stderr: ${clearBackupStderr}`);
            return;
        }

        exec(clearDumpDirCommand, (clearDumpError, clearDumpStdout, clearDumpStderr) => {
            if (clearDumpError) {
                console.error(`Error clearing dumpDir: ${clearDumpError.message}`);
                return;
            }

            if (clearDumpStderr) {
                console.error(`Error clearing dumpDir stderr: ${clearDumpStderr}`);
                return;
            }

            exec(mongodumpCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing backup: ${error.message}`);
                    return;
                }

                if (stderr && !stderr.includes('WARNING:')) {
                    console.error(`mongodump process stderr: ${stderr}`);
                    return;
                }

                console.log(`Backup process stdout: ${stdout}`);

                exec(tarCommand, (tarError, tarStdout, tarStderr) => {
                    if (tarError) {
                        console.error(`Error creating tar.gz: ${tarError.message}`);
                        return;
                    }

                    if (tarStderr) {
                        console.error(`tar process stderr: ${tarStderr}`);
                        return;
                    }

                    void uploadFile({ dumpFileName, fileName: fileNameDaily, backupsDir, prefix: s3prefixDaily, filesToKeep, contentType: dumpContentType });
                    void uploadFile({ dumpFileName, fileName: fileNameMonthly, backupsDir, prefix: s3prefixMonthly, contentType: dumpContentType });
                    console.log(`Backup successfully created at ${backupPath}`);
                    return fileNameDaily;

                });
            });
        });
    });
}

// cron.schedule(backup_cron, () => {
//     if (isProduction) {
//         void dbBackup(); // run automatically when import?
//     }
// });

// export default dbBackup;


async function initBackupCron() {
    const cronBackup = await getSetting<string>('backup', 'db-cron');
    const shouldBackup = await getSetting<boolean>('backup', 'db-should-backup');
    // console.log('>>>>>>>>>>>>>Backup cron', cronBackup, shouldBackup, isProduction);
    cron.schedule(cronBackup, () => {
        if (shouldBackup && isProduction) {
            void dbBackup();
        }
    });
}

export default initBackupCron;