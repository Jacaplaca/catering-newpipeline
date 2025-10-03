import { readFileSync } from 'fs';
import { s3putPresign } from '@root/app/server/s3/presign';
import path from 'path';
import axios from 'axios';
import { getOldestKeys } from '@root/app/server/s3/list';
import { s3deleteKeys } from '@root/app/server/s3/delete';
import { s3ObjectExists } from '@root/app/server/s3/exists';

const uploadFile = async (
    { dumpFileName, fileName, backupsDir, prefix, filesToKeep, shouldOverwrite, contentType }:
        {
            dumpFileName: string, fileName: string,
            backupsDir: string, prefix: string,
            filesToKeep?: number, shouldOverwrite?: boolean,
            contentType: string
        }
) => {
    // Check if file exists and handle overwrite logic
    if (!shouldOverwrite) {
        const fileExists = await s3ObjectExists(fileName, prefix);
        if (fileExists) {
            console.log(`File ${fileName} already exists in ${prefix}. Skipping upload (shouldOverwrite=false)`);
            return;
        }
    }

    const got = await s3putPresign({ count: 1, prefix, key: fileName, contentType });

    if (got[0]) {
        const { url } = got[0];

        try {
            const backupPath = path.join(backupsDir, dumpFileName);
            const fileContent = readFileSync(backupPath);
            await axios.put(url, fileContent, {
                headers: {
                    'Content-Type': contentType,
                    'Content-Length': fileContent.length,
                },
            });

            if (filesToKeep != null) {
                const oldestKeys = await getOldestKeys(prefix, filesToKeep);
                await s3deleteKeys(oldestKeys);
            }


            console.log(`File ${fileName} uploaded successfully to ${prefix}${shouldOverwrite ? ' (overwrite enabled)' : ' (new file)'}`);
        } catch (uploadError) {
            console.error(`Error uploading file: ${JSON.stringify(uploadError)}`);
        }
    }
}

export default uploadFile;