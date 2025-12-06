// deployment/backup-service/src/backup.ts
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = util.promisify(exec);

export async function runBackup() {
    // Konfiguracja
    const DB_URL = process.env.DATABASE_URL;
    const BACKUP_DIR = process.env.BACKUP_DIR ?? '/backups';
    const MAX_BACKUPS = parseInt(process.env.MAX_LOCAL_BACKUPS ?? '7'); // Ile plików trzymać lokalnie

    if (!DB_URL) {
        console.error('❌ DATABASE_URL is missing!');
        return;
    }

    // Upewnij się, że katalog istnieje
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${timestamp}.gz`;
    const filePath = path.join(BACKUP_DIR, fileName);

    console.log(`[Backup] Starting backup to: ${filePath}`);

    try {
        // 1. Wykonanie zrzutu
        // --archive: zapisuje do jednego pliku zamiast folderu
        // --gzip: kompresuje w locie
        const command = `mongodump --uri="${DB_URL}" --archive="${filePath}" --gzip`;

        await execPromise(command);
        console.log(`✅ Backup created successfully: ${fileName}`);

        // 2. Czyszczenie starych kopii (Rotacja)
        cleanupOldBackups(BACKUP_DIR, MAX_BACKUPS);

    } catch (error) {
        console.error('❌ Backup failed:', error);
        // Usuń uszkodzony plik, jeśli powstał (np. 0 bajtów)
        if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) { }
        }
    }
}

function cleanupOldBackups(dir: string, maxFiles: number) {
    try {
        const files = fs.readdirSync(dir)
            .filter(file => file.endsWith('.gz'))
            .map(file => ({
                name: file,
                path: path.join(dir, file),
                time: fs.statSync(path.join(dir, file)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time); // Najnowsze na początku

        if (files.length > maxFiles) {
            const filesToDelete = files.slice(maxFiles);
            console.log(`[Cleanup] Removing ${filesToDelete.length} old backups...`);

            filesToDelete.forEach(file => {
                fs.unlinkSync(file.path);
                console.log(`Deleted: ${file.name}`);
            });
        }
    } catch (err) {
        console.error('[Cleanup] Error during cleanup:', err);
    }
}