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
        prefix: process.env.S3_PREFIX ?? `backups/${process.env.APP_NAME ?? 'backup'}/daily` // Domyślny folder w buckecie
    },
    keep: parseInt(process.env.MAX_REMOTE_BACKUPS ?? '7')
};

/**
 * Główna funkcja wykonująca backup
 * @param {Object} options - Opcje nadpisujące domyślną konfigurację
 * @param {string} [options.fileName] - Nazwa pliku (domyślnie generowana z daty)
 * @param {string} [options.s3Prefix] - Prefix w S3 (katalog)
 * @param {number} [options.filesToKeep] - Liczba plików do zachowania (rotacja)
 */
async function runBackup(options = {}) {
    const backupType = options.s3Prefix && options.s3Prefix.includes('manual') ? 'MANUAL' : 'DAILY';
    console.log(`[Backup] Starting ${backupType} job for ${CONFIG.appName}...`);
    
    if (!fs.existsSync(CONFIG.backupDir)) fs.mkdirSync(CONFIG.backupDir, { recursive: true });

    // Ustalanie nazwy pliku
    let fileName = options.fileName;
    if (!fileName) {
        // Format daty: YYYY-MM-DD
        const dateStr = new Date().toISOString().split('T')[0];
        fileName = `db_${CONFIG.appName}_${dateStr}.gz`;
    }

    const filePath = path.join(CONFIG.backupDir, fileName);

    // Ustalanie konfiguracji S3
    const s3Config = { ...CONFIG.s3 };
    if (options.s3Prefix) {
        s3Config.prefix = options.s3Prefix;
    }

    // Ustalanie polityki retencji
    // Jeśli nie podano filesToKeep, używamy CONFIG.keep (dla manual domyślnie 0 w wywołaniu, ale tu fallback)
    const filesToKeep = options.filesToKeep ?? CONFIG.keep;

    try {
        // 1. Dump (kompresja w locie)
        console.log('[Backup] Running mongodump...');
        const startTime = Date.now();
        await execAsync(`mongodump --uri="${CONFIG.dbUrl}" --archive="${filePath}" --gzip`);
        const endTime = Date.now();
        
        // Statystyki
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        const stats = fs.statSync(filePath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log(`[Backup] Dump created in ${duration}s. Size: ${fileSizeMB} MB`);
        
        // 2. Upload
        console.log(`[Backup] Sending to S3 (prefix: ${s3Config.prefix})...`);
        await uploadToS3({
            filePath,
            fileName,
            s3Config,
            filesToKeep
        });

        console.log('[Backup] ✅ Process finished successfully.');

    } catch (err) {
        console.error('[Backup] ❌ FAILED:', err);
        // Jeśli to manualny run, rzucamy błąd wyżej, żeby proces zakończył się błędem
        if (options.isManual) throw err;
    } finally {
        // 3. Cleanup lokalny
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('[Backup] Local temp file removed.');
        }
    }
}

// Sprawdzenie czy uruchomiono w trybie manualnym
const isManual = process.argv.includes('manual');

if (isManual) {
    // Tryb manualny
    const now = new Date();
    // Format: YYYY-MM-DD_HH-mm-ss
    const timestamp = now.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
    const fileName = `db_${CONFIG.appName}_${timestamp}.gz`;
    
    // Zmiana folderu daily -> manual
    // Jeśli prefix domyślny zawiera /daily, zamieniamy na /manual
    // W przeciwnym razie doklejamy /manual
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
        filesToKeep: 0, // Nie usuwamy starych manualnych backupów automatycznie
        isManual: true
    }).then(() => {
        console.log('[Service] Manual backup finished.');
        process.exit(0);
    }).catch(() => {
        console.error('[Service] Manual backup failed.');
        process.exit(1);
    });

} else {
    // Tryb demona (cron)
    console.log(`[Service] Backup Service started. Schedule: ${CONFIG.cron}`);

    cron.schedule(CONFIG.cron, () => {
        void runBackup();
    });

    // Obsługa zatrzymania
    process.on('SIGTERM', () => process.exit(0));
}
