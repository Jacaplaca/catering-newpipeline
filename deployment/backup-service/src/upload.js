import fs from 'fs';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

export async function uploadToS3({ filePath, fileName, s3Config, filesToKeep = 7, dryRun = false }) {
    if (dryRun) {
        console.log('[S3] DRY RUN: skipping upload and retention cleanup.');
        console.log(`[S3] Would upload: bucket=${s3Config.bucketName} key=${s3Config.prefix}/${fileName}`);
        if (filesToKeep > 0) {
            console.log(`[S3] Would apply retention policy: keep newest ${filesToKeep} objects under prefix=${s3Config.prefix}`);
        } else {
            console.log('[S3] Retention cleanup disabled (filesToKeep=0).');
        }
        return;
    }

    const clientConfig = {
        region: s3Config.region,
        credentials: {
            accessKeyId: s3Config.accessKeyId,
            secretAccessKey: s3Config.secretAccessKey,
        },
    };

    // Optional custom endpoint (MinIO / Cloudflare R2 / other S3-compatible storage)
    if (s3Config.endpoint) {
        clientConfig.endpoint = s3Config.endpoint;
    }
    if (typeof s3Config.forcePathStyle === 'boolean') {
        clientConfig.forcePathStyle = s3Config.forcePathStyle;
    }

    const client = new S3Client(clientConfig);

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
        console.log('[S3] Upload successful.');

        // 2. Retention (delete old backups)
        if (filesToKeep > 0) {
            const listParams = {
                Bucket: bucket,
                Prefix: s3Config.prefix
            };
            
            const data = await client.send(new ListObjectsV2Command(listParams));
            
            if (data.Contents && data.Contents.length > filesToKeep) {
                // Sort: newest first
                const sortedFiles = data.Contents.sort((a, b) => b.LastModified - a.LastModified);
                
                // Delete everything beyond the keep limit
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