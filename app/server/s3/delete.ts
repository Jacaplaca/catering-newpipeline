import { DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { env } from '@root/app/env';
import { s3getList } from '@root/app/server/s3/list';
import { s3Client } from '@root/app/server/s3/s3';

export const s3deleteFromPrefix = async (prefix?: string) => {
    const listedObjects = await s3getList(prefix);

    try {

        if (!listedObjects?.Contents || listedObjects.Contents.length === 0) return;

        const deleteParams = {
            Bucket: env.S3_BUCKET,
            Delete: { Objects: [] }
        } as { Bucket: string; Delete: { Objects: { Key: string }[] } };

        listedObjects.Contents.forEach(({ Key }) => {
            if (Key) deleteParams.Delete.Objects.push({ Key });
        });

        await s3Client.send(new DeleteObjectsCommand(deleteParams));

        if (listedObjects.IsTruncated) await s3deleteFromPrefix(prefix);
    } catch (err) {
        console.error("Error", err);
    }
}

export const s3deleteKeys = async (keys: string[]) => {
    console.log(`s3deleteKeys called with ${keys.length} keys`);

    // Check if keys array is empty
    if (!keys || keys.length === 0) {
        console.log('No S3 keys provided to delete');
        return;
    }

    // Filter and validate keys
    const validKeys = keys.filter(key => {
        if (!key || typeof key !== 'string') {
            console.warn('Invalid key found (not a string):', key);
            return false;
        }
        const trimmed = key.trim();
        if (trimmed.length === 0) {
            console.warn('Empty key found');
            return false;
        }
        // Check for potentially problematic characters
        if (!/^[a-zA-Z0-9!_.*'()\/-]+$/.test(trimmed)) {
            console.warn('Key contains potentially problematic characters:', trimmed);
            // Don't filter out, just warn - S3 might still accept it
        }
        return true;
    });

    console.log(`Filtered to ${validKeys.length} valid keys`);

    if (validKeys.length === 0) {
        console.log('No valid S3 keys to delete after filtering');
        return;
    }

    // AWS S3 limit is 1000 objects per request
    const maxBatchSize = 499;

    for (let i = 0; i < validKeys.length; i += maxBatchSize) {
        const batch = validKeys.slice(i, i + maxBatchSize);
        console.log(`Deleting batch ${Math.floor(i / maxBatchSize) + 1}: ${batch.length} keys`);

        try {
            const deleteParams = {
                Bucket: env.S3_BUCKET,
                Delete: {
                    Objects: batch.map(key => ({ Key: key })),
                    Quiet: false // This will return info about which deletions succeeded/failed
                }
            };

            console.log('Sample keys in this batch:', batch.slice(0, 3));

            const result = await s3Client.send(new DeleteObjectsCommand(deleteParams));

            if (result.Errors && result.Errors.length > 0) {
                console.warn('Some deletions failed:', result.Errors);
            }

            if (result.Deleted && result.Deleted.length > 0) {
                console.log(`Successfully deleted ${result.Deleted.length} objects in this batch`);
            }

        } catch (error) {
            console.error(`Error deleting batch ${Math.floor(i / maxBatchSize) + 1}:`, error);
            console.error('Problematic keys in this batch:', batch);
            throw error; // Re-throw to stop the whole operation
        }
    }
};
