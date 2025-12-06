import fs from 'fs';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

export async function uploadToS3({ filePath, fileName, s3Config, filesToKeep = 7 }) {
    const client = new S3Client({
        region: s3Config.region,
        credentials: {
            accessKeyId: s3Config.accessKeyId,
            secretAccessKey: s3Config.secretAccessKey,
        },
    });

    const bucket = s3Config.bucketName;
    const key = `${s3Config.prefix}/${fileName}`;

    try {
        // 1. Upload
        console.log(`[S3] Uploading ${fileName}...`);
        const fileStream = fs.createReadStream(filePath);
        
        await client.send(new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: fileStream,
        }));
        console.log(`[S3] Upload successful.`);

        // 2. Rotacja (usuwanie starych)
        if (filesToKeep > 0) {
            const listParams = {
                Bucket: bucket,
                Prefix: s3Config.prefix
            };
            
            const data = await client.send(new ListObjectsV2Command(listParams));
            
            if (data.Contents && data.Contents.length > filesToKeep) {
                // Sortowanie: najnowsze na początku
                const sortedFiles = data.Contents.sort((a, b) => b.LastModified - a.LastModified);
                
                // Te do usunięcia
                const toDelete = sortedFiles.slice(filesToKeep).map(f => ({ Key: f.Key }));
                
                if (toDelete.length > 0) {
                    console.log(`[S3] Cleaning up ${toDelete.length} old backups...`);
                    await client.send(new DeleteObjectsCommand({
                        Bucket: bucket,
                        Delete: { Objects: toDelete }
                    }));
                }
            }
        }

    } catch (error) {
        console.error('[S3] Error:', error);
        throw error;
    }
}