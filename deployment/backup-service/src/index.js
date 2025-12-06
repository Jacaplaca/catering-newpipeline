import cron from 'node-cron';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import { uploadToS3 } from './upload.js';

const execAsync = util.promisify(exec);

// Konfiguracja ze zmiennych środowiskowych
const CONFIG = {
    cron: process.env.BACKUP_CRON ?? '0 3 * * *',
    dbUrl: process.env.DATABASE_URL,
    appName: process.env.APP_NAME ?? 'backup',
    backupDir: '/backups',
    s3: {
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        bucketName: process.env.AWS_S3_BUCKET,
        prefix: process.env.S3_PREFIX ?? 'backups/test_service_backup/daily' // Domyślny folder w buckecie
    },
    keep: parseInt(process.env.MAX_REMOTE_BACKUPS ?? '7')
};

async function runBackup() {
    console.log(`[Backup] Starting job for ${CONFIG.appName}...`);
    
    if (!fs.existsSync(CONFIG.backupDir)) fs.mkdirSync(CONFIG.backupDir, { recursive: true });

    // Format daty: YYYY-MM-DD
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `db_${CONFIG.appName}_${dateStr}.gz`;
    const filePath = path.join(CONFIG.backupDir, fileName);

    try {
        // 1. Dump (kompresja w locie)
        console.log('[Backup] Running mongodump...');
        await execAsync(`mongodump --uri="${CONFIG.dbUrl}" --archive="${filePath}" --gzip`);
        
        // 2. Upload
        console.log('[Backup] Sending to S3...');
        await uploadToS3({
            filePath,
            fileName,
            s3Config: CONFIG.s3,
            filesToKeep: CONFIG.keep
        });

        console.log('[Backup] ✅ Process finished successfully.');

    } catch (err) {
        console.error('[Backup] ❌ FAILED:', err);
    } finally {
        // 3. Cleanup lokalny (nie trzymamy plików w kontenerze, bo lecą do chmury)
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('[Backup] Local temp file removed.');
        }
    }
}

console.log(`[Service] Backup Service started. Schedule: ${CONFIG.cron}`);

cron.schedule(CONFIG.cron, () => {
    void runBackup();
});

// Obsługa zatrzymania
process.on('SIGTERM', () => process.exit(0));