import cron from 'node-cron';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import { uploadToS3 } from './upload.js';

const execAsync = util.promisify(exec);

function parseBoolean(value, defaultValue = false) {
    if (value === undefined || value === null) return defaultValue;
    const normalized = String(value).trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
    return defaultValue;
}

function maskMongoUri(uri) {
    if (!uri) return '';
    // Best-effort masking: hide password in user:pass@ segment.
    return String(uri).replace(/:(.*?)@/g, ':*****@');
}

// Configuration from environment variables
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
        endpoint: process.env.AWS_ENDPOINT ?? process.env.S3_ENDPOINT ?? process.env.S3_SERVER_ENDPOINT,
        forcePathStyle: parseBoolean(process.env.S3_FORCE_PATH_STYLE ?? process.env.AWS_S3_FORCE_PATH_STYLE, false),
        prefix: process.env.S3_PREFIX ?? `backups/${process.env.APP_NAME ?? 'backup'}/daily` // Default folder in the bucket
    },
    keep: parseInt(process.env.MAX_REMOTE_BACKUPS ?? '7')
};

/**
 * Main backup function.
 * @param {Object} options - Options overriding the default configuration
 * @param {string} [options.fileName] - File name (generated from date by default)
 * @param {string} [options.s3Prefix] - S3 prefix (folder)
 * @param {number} [options.filesToKeep] - Number of files to keep (rotation)
 * @param {boolean} [options.dryRun] - If true, do not perform any real side effects
 */
async function runBackup(options = {}) {
    const backupType = options.s3Prefix && options.s3Prefix.includes('manual') ? 'MANUAL' : 'DAILY';
    console.log(`[Backup] Starting ${backupType} job for ${CONFIG.appName}...`);
    
    const dryRun = Boolean(options.dryRun);
    if (dryRun) {
        console.log('[Backup] DRY RUN is enabled. No real side effects will be performed.');
    }

    if (!dryRun) {
        if (!fs.existsSync(CONFIG.backupDir)) fs.mkdirSync(CONFIG.backupDir, { recursive: true });
    }

    // Determine file name
    let fileName = options.fileName;
    if (!fileName) {
        // Date format: YYYY-MM-DD
        const dateStr = new Date().toISOString().split('T')[0];
        fileName = `db_${CONFIG.appName}_${dateStr}.gz`;
    }

    const filePath = path.join(CONFIG.backupDir, fileName);

    // Merge S3 configuration
    const s3Config = { ...CONFIG.s3 };
    if (options.s3Prefix) {
        s3Config.prefix = options.s3Prefix;
    }

    // Retention policy:
    // If filesToKeep is not provided, use CONFIG.keep (manual sets 0, but this keeps a safe fallback)
    const filesToKeep = options.filesToKeep ?? CONFIG.keep;

    try {
        if (dryRun) {
            console.log('[Backup] Would run mongodump to create archive:');
            console.log(`         filePath=${filePath}`);
            console.log(`         dbUrl=${maskMongoUri(CONFIG.dbUrl)}`);
        } else {
            // 1) Dump (gzip on the fly)
            console.log('[Backup] Running mongodump...');
            const startTime = Date.now();
            await execAsync(`mongodump --uri="${CONFIG.dbUrl}" --archive="${filePath}" --gzip`);
            const endTime = Date.now();
            
            // Stats
            const duration = ((endTime - startTime) / 1000).toFixed(2);
            const stats = fs.statSync(filePath);
            const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

            console.log(`[Backup] Dump created in ${duration}s. Size: ${fileSizeMB} MB`);
        }
        
        // 2) Upload
        console.log(`[Backup] Sending to S3 (prefix: ${s3Config.prefix})...`);
        await uploadToS3({
            filePath,
            fileName,
            s3Config,
            filesToKeep,
            dryRun
        });

        console.log('[Backup] ✅ Finished successfully.');

    } catch (err) {
        console.error('[Backup] ❌ FAILED:', err);
        // If it's a manual run, rethrow to exit with non-zero code.
        if (options.isManual) throw err;
    } finally {
        if (!dryRun) {
            // 3) Local cleanup
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('[Backup] Local temp file removed.');
            }
        }
    }
}

// Check if running in manual mode
const isManual = process.argv.includes('manual');
const isDryRun = process.argv.includes('--dry-run') || parseBoolean(process.env.BACKUP_DRY_RUN, false);

if (isManual) {
    // Manual mode
    const now = new Date();
    // Format: YYYY-MM-DD_HH-mm-ss
    const timestamp = now.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
    const fileName = `db_${CONFIG.appName}_${timestamp}.gz`;
    
    // Switch folder daily -> manual
    // If the default prefix ends with /daily, replace it with /manual
    // Otherwise append /manual
    let manualPrefix = CONFIG.s3.prefix;
    if (manualPrefix.endsWith('/daily')) {
        manualPrefix = manualPrefix.replace(/\/daily$/, '/manual');
    } else {
        manualPrefix = `${manualPrefix}/manual`;
    }

    console.log('[Service] Manual backup triggered.');
    
    runBackup({
        fileName,
        s3Prefix: manualPrefix,
        filesToKeep: 0, // Do not delete old manual backups automatically
        isManual: true,
        dryRun: isDryRun
    }).then(() => {
        console.log('[Service] Manual backup finished.');
        process.exit(0);
    }).catch(() => {
        console.error('[Service] Manual backup failed.');
        process.exit(1);
    });

} else {
    // Daemon mode (cron)
    console.log(`[Service] Backup Service started. Schedule: ${CONFIG.cron}`);
    if (isDryRun) {
        console.log('[Service] DRY RUN is enabled (BACKUP_DRY_RUN/--dry-run). Scheduled jobs will not perform side effects.');
    }

    cron.schedule(CONFIG.cron, () => {
        void runBackup({ dryRun: isDryRun });
    });

    // Shutdown handling
    process.on('SIGTERM', () => process.exit(0));
}
