import getFile from '@root/app/server/lib/getFile';
import { s3putPresign } from '@root/app/server/s3/presign';
import axios from 'axios';

// Function to upload a file to S3
const uploadUrlFileToS3 = async (fileUrl: string, prefix?: string, key?: string) => {
    // Step 1: Get the file buffer, extension, and MIME type
    const { buffer, mimeType } = await getFile(fileUrl);

    // Step 2: Get the presigned URL for uploading to S3
    const got = await s3putPresign({ count: 1, prefix, key, contentType: mimeType });
    if (got[0]) {
        const { url, key: s3Key } = got[0];
        // Step 3: Upload the file buffer to S3 using the presigned URL
        await axios.put(url, buffer, {
            headers: {
                'Content-Type': mimeType,
            },
        });

        return s3Key; // Return the key of the uploaded file in S3
    }
    return '';
};

export default uploadUrlFileToS3;