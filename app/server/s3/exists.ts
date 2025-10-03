import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { env } from '@root/app/env';
import { s3Client } from '@root/app/server/s3/s3';

/**
 * Check if an object exists in S3 bucket
 * @param key - The S3 object key to check
 * @param prefix - Optional prefix to prepend to the key
 * @returns true if object exists, false otherwise
 */
export const s3ObjectExists = async (key: string, prefix?: string): Promise<boolean> => {
    try {
        const fullKey = prefix ? `${prefix}/${key}` : key;

        await s3Client.send(new HeadObjectCommand({
            Bucket: env.S3_BUCKET,
            Key: fullKey
        }));

        return true; // Object exists
    } catch (error) {
        // console.error(error);
        return false;
    }
};
