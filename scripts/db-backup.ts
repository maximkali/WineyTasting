import { pool } from '../server/core/database';
import { exec } from 'child_process';
import { format } from 'date-fns';

const backupFile = `backup-${format(new Date(), 'yyyy-MM-dd')}.sql`;

exec(`pg_dump -h localhost -U winetasting_user -F c -b -v -f ${backupFile} winetasting`, 
  (error) => {
    if (error) {
      console.error('Backup failed:', error);
      process.exit(1);
    }
    console.log(`Backup saved to ${backupFile}`);
  }
);
