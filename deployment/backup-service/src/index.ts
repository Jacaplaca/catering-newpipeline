// deployment/backup-service/src/index.ts
import cron from 'node-cron';
import { runBackup } from './backup';
import dotenv from 'dotenv';

dotenv.config();

const CRON_SCHEDULE = process.env.BACKUP_CRON ?? '0 3 * * *'; // Domyślnie 3:00 rano

console.log('🚀 Backup Service Initialized');
console.log(`📅 Schedule: ${CRON_SCHEDULE}`);

// Cron job
cron.schedule(CRON_SCHEDULE, () => {
    console.log('⏰ Triggering scheduled backup...');
    void runBackup();
});

// Obsługa zatrzymania kontenera (Graceful Shutdown)
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Backup service stopping...');
    process.exit(0);
});