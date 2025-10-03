import { GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@root/app/env';
import { s3Client } from '@root/app/server/s3/s3';
import { v4 as uuidV4 } from "uuid";
import pLimit from 'p-limit';
const limit = pLimit(5);

export const s3putPresign = async (
    { count = 1, prefix, key, contentType }: { count?: number, prefix?: string, key?: string, contentType?: string }) => {
    const promises = Array.from({ length: count }).map(() => limit(async () => {
        const uuid = key ? key : uuidV4();
        const path = prefix ? `${prefix}/${uuid}` : uuid;

        const url = await getSignedUrl(
            s3Client,
            new PutObjectCommand({
                Bucket: env.S3_BUCKET,
                Key: path,
                ContentType: contentType ?? undefined
            })
        );
        return {
            url,
            key: uuid,
        };
    }));

    return await Promise.all(promises);
};

export const s3getPresign = async (keys: string[]): Promise<{ url: string, key: string }[]> => {
    if (!keys.length) {
        return [];
    }
    const promises = keys.map(key => limit(async () => {

        let url = '';

        try {
            key && await s3Client.send(new HeadObjectCommand({
                Bucket: env.S3_BUCKET,
                Key: key
            }))

            url = await getSignedUrl(
                s3Client,
                new GetObjectCommand({
                    Bucket: env.S3_BUCKET,
                    Key: key
                })
            );
        } catch (error) {
        } finally {
            return {
                url,
                key,
            };
        }

    }));

    return await Promise.all(promises);
};