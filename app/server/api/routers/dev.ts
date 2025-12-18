import getCurrentTime from '@root/app/lib/date/getCurrentTime';
import removeCateringsExcept from '@root/app/server/api/routers/specific/libs/devTools/removeCateringsExcept';
import removeClientsExcept from '@root/app/server/api/routers/specific/libs/devTools/removeClientsExcept';
import removeMenusExcept from '@root/app/server/api/routers/specific/libs/devTools/removeMenusExcept';
import removeOrdersExcept from '@root/app/server/api/routers/specific/libs/devTools/removeOrdersExcept';
// import { s3getFiles, s3getList } from '@root/app/server/s3/list';
// import path from 'path';
import { publicProcedure } from "server/api/trpc";
import { z } from 'zod';
// import autoOrder from '@root/app/server/lib/autoOrder';
// import initAutoOrderCron from '@root/app/server/lib/autoOrder';
// import fs from 'fs';
// import formatFileSize from '@root/app/specific/lib/formatFileSize';



// void initAutoOrderCron();



export const devRouter = {
    testAbc: publicProcedure.query(() => {
        return "Hello World!";
    }),
    test: publicProcedure.query(() => {
        return "Hello World!";
    }),
    // removeCaterings: publicProcedure.query(async () => {
    //     await removeCateringsExcept(["cm34dgxuf000tqmfqens7pj2e"]);
    //     return { success: true };
    // }),
    // removeClients: publicProcedure.query(async () => {
    //     await removeClientsExcept("cm34dgxuf000tqmfqens7pj2e", [
    //         "cm60ohxqi004lph0jge25tz1e"
    //     ]);
    //     return { success: true };
    // }),
    // removeMenus: publicProcedure.query(async () => {
    //     //make 0 indexed month
    //     await removeMenusExcept("cm34dgxuf000tqmfqens7pj2e", ["2025-09-06", "2025-09-07"]);
    //     return { success: true };
    // }),
    // removeOrders: publicProcedure.query(async () => {
    //     //make 0 indexed month
    //     await removeOrdersExcept("cm34dgxuf000tqmfqens7pj2e", ["2025-09-02", "2025-09-03"]);
    //     return { success: true };
    // }),
    // autoOrder: publicProcedure.query(async () => {
    //     await autoOrder();
    //     return { autoOrder: 'success' };
    // }),
    // backup: publicProcedure.query(async () => {
    //     const fileName = await dbBackup();
    //     return { backupFileName: fileName };
    // }),
    // autoOrder: publicProcedure.query(async () => {
    //     await autoOrder();
    //     return { autoOrder: 'success' };
    // }),
    // cleanupOrders: publicProcedure.query(async () => {
    //     await cleanupOrders();
    //     return { cleanupOrders: 'success' };
    // }),
    // cleanupMenu: publicProcedure.query(async () => {
    //     await cleanupMenu();
    //     return { cleanupMenu: 'success' };
    // }),
    // cleanupClientFiles: publicProcedure.query(async () => {
    //     await cleanupClientFiles();
    //     return { cleanupClientFiles: 'success' };
    // }),
    //TODO: remove this
    // removeOrder: publicProcedure.input(z.object({
    //     orderId: z.string(),
    // })).query(async ({ input }) => {
    //     await db.order.delete({
    //         where: { id: input.orderId },
    //     });
    // }),
    dbg: publicProcedure
        .input(z.object({
            time: z.string(),
        }))
        .query(({ input }) => {
            console.log(input);
            const desiredTimeZone = 'Europe/Warsaw';
            const dateTime = getCurrentTime();
            return {
                dateTime,
                dateTimeString: dateTime.toLocaleString(),
                dateTimeJson: dateTime.toJSON(),
                desiredTimeZone,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                myTime: input.time,
            }
        }),
    // clean: publicProcedure
    //     .query(async () => {
    //         const cateringToCleanId = "cm3367ypi0009qmfqz5u1g22k"; //damian
    //         // const cateringToCleanId = "cm44ae02d0003ph0ibufv8t4r"; //moj
    //         // const cateringToCleanId = "cm34dgxuf000tqmfqens7pj2e"; //ekoplanet

    //         try {
    //             // Clean catering data while preserving employees
    //             await cleanCateringData(cateringToCleanId);

    //             return { success: true, message: `Catering ${cateringToCleanId} data cleaned successfully` };
    //         } catch (error) {
    //             // Use safe error logging to avoid source map issues
    //             const errorMessage = error instanceof Error ? error.message : String(error);
    //             console.log('Error cleaning catering data:', errorMessage);

    //             return {
    //                 success: false,
    //                 error: errorMessage,
    //                 cateringId: cateringToCleanId
    //             };
    //         }
    //     }),
    // copy: publicProcedure
    //     .query(async () => {

    //         const cateringIdToCopyOrigin = "cm34dgxuf000tqmfqens7pj2e"; //ekoplanet
    //         const cateringIdToCopyDestination = "cm3367ypi0009qmfqz5u1g22k"; //damian

    //         return await copyCateringDataToOther({
    //             sourceCateringId: cateringIdToCopyOrigin,
    //             destinationCateringId: cateringIdToCopyDestination,
    //         });

    //     }),
    // s3List: publicProcedure.query(async () => {
    //     return await s3getList("dev-client-files");
    // }),
    // s3: publicProcedure.query(async () => {
    //     try {
    //         // return await s3getList("client-files");
    //         // const files = await s3getFiles("default");
    //         const files = await s3getFiles("client-files");
    //         // files example:
    //         // [{
    //         //     url: 'https://example.com/file.pdf',
    //         //     key: 'default/file.pdf'
    //         // }]
    //         const savedFiles: string[] = [];
    //         const skippedDirs: string[] = [];
    //         const skippedExisting: string[] = [];
    //         let totalBytesDownloaded = 0;
    //         let filesDownloaded = 0;
    //         let actualFilesCount = 0; // Count only actual files (not directories)

    //         for (const file of files) {
    //             try {
    //                 // Skip directory keys (ending with /)
    //                 if (file.key.endsWith('/')) {
    //                     console.log(`Skipping directory key: ${file.key}`);
    //                     skippedDirs.push(file.key);
    //                     continue;
    //                 }

    //                 // Count this as an actual file
    //                 actualFilesCount++;

    //                 const filePath = path.join('app/assets/s3_back', file.key);

    //                 // Check if file already exists
    //                 if (fs.existsSync(filePath)) {
    //                     console.log(`File already exists, skipping: ${file.key}`);
    //                     skippedExisting.push(file.key);
    //                     continue;
    //                 }

    //                 const response = await fetch(file.url);
    //                 if (!response.ok) {
    //                     console.error(`Failed to fetch file from S3: ${file.key}, status: ${response.status}`);
    //                     continue;
    //                 }

    //                 const fileContent = await response.arrayBuffer();
    //                 const fileSize = fileContent.byteLength;

    //                 // Create directory structure if it doesn't exist
    //                 const dir = path.dirname(filePath);

    //                 // Check for file conflicts in the entire directory path
    //                 const pathParts = dir.split(path.sep);
    //                 let currentPath = '';

    //                 for (const part of pathParts) {
    //                     if (part) { // Skip empty parts (like from leading separator)
    //                         currentPath = currentPath ? path.join(currentPath, part) : part;

    //                         if (fs.existsSync(currentPath) && fs.statSync(currentPath).isFile()) {
    //                             console.log(`Removing file that conflicts with directory: ${currentPath}`);
    //                             fs.unlinkSync(currentPath);
    //                         }
    //                     }
    //                 }

    //                 fs.mkdirSync(dir, { recursive: true });

    //                 fs.writeFileSync(filePath, Buffer.from(fileContent));

    //                 // Update statistics
    //                 filesDownloaded++;
    //                 totalBytesDownloaded += fileSize;
    //                 savedFiles.push(file.key);

    //                 console.log(`[${filesDownloaded}] Saved: ${file.key}`);
    //                 console.log(`   File size: ${formatFileSize(fileSize)}`);
    //                 console.log(`   Total downloaded: ${formatFileSize(totalBytesDownloaded)} (${filesDownloaded} files)`);
    //             } catch (fileError) {
    //                 console.error(`Error processing file ${file.key}:`, fileError);
    //             }
    //         }

    //         console.log(`\n=== Download Summary ===`);
    //         console.log(`Total items from S3: ${files.length}`);
    //         console.log(`Actual files found: ${actualFilesCount}`);
    //         console.log(`Files successfully downloaded: ${filesDownloaded}`);
    //         console.log(`Files already existed (skipped): ${skippedExisting.length}`);
    //         console.log(`Directories skipped: ${skippedDirs.length}`);
    //         console.log(`Total size downloaded: ${formatFileSize(totalBytesDownloaded)}`);

    //         return {
    //             success: true,
    //             totalItemsFromS3: files.length,
    //             actualFilesFound: actualFilesCount,
    //             filesDownloaded: filesDownloaded,
    //             filesSaved: savedFiles.length,
    //             filesAlreadyExisted: skippedExisting.length,
    //             directoriesSkipped: skippedDirs.length,
    //             totalBytesDownloaded: totalBytesDownloaded,
    //             totalSizeFormatted: formatFileSize(totalBytesDownloaded),
    //             savedFiles,
    //             skippedExistingFiles: skippedExisting,
    //             skippedDirectories: skippedDirs
    //         };
    //     } catch (error) {
    //         console.error('Error in S3 endpoint:', error);
    //         return {
    //             success: false,
    //             error: error instanceof Error ? error.message : String(error)
    //         };
    //     }
    // }),
    // clientFilesMod: publicProcedure.query(async () => {
    //     const { db } = await import('@root/app/server/db');

    //     try {
    //         let processedCount = 0;
    //         let modifiedCount = 0;
    //         let cursor: string | undefined = undefined;
    //         const batchSize = 100; // Process in batches of 100

    //         console.log('Starting ClientFile s3Key modification...');

    //         while (true) {
    //             // Get batch of ClientFile records using cursor pagination
    //             const clientFiles: Array<{ id: string; s3Key: string }> = await db.clientFile.findMany({
    //                 take: batchSize,
    //                 ...(cursor && {
    //                     skip: 1, // Skip the cursor record
    //                     cursor: { id: cursor }
    //                 }),
    //                 orderBy: { id: 'asc' },
    //                 select: {
    //                     id: true,
    //                     s3Key: true
    //                 }
    //             });

    //             // If no more records, break the loop
    //             if (clientFiles.length === 0) {
    //                 break;
    //             }

    //             // Process each record in the batch
    //             for (const file of clientFiles) {
    //                 processedCount++;

    //                 // Check if s3Key starts with 'client-files/'
    //                 if (file.s3Key.startsWith('client-files/')) {
    //                     // Replace prefix with 'dev-client-files/'
    //                     const newS3Key: string = file.s3Key.replace(/^client-files\//, 'dev-client-files/');

    //                     // Update the record in database
    //                     await db.clientFile.update({
    //                         where: { id: file.id },
    //                         data: { s3Key: newS3Key }
    //                     });

    //                     modifiedCount++;
    //                     console.log(`[${modifiedCount}] Modified: ${file.s3Key} -> ${newS3Key}`);
    //                 }
    //             }

    //             // Set cursor to the last record's id for next iteration
    //             const lastFile = clientFiles[clientFiles.length - 1];
    //             cursor = lastFile?.id;

    //             console.log(`Processed batch: ${processedCount} total records processed`);
    //         }

    //         console.log(`\n=== ClientFile Modification Summary ===`);
    //         console.log(`Total records processed: ${processedCount}`);
    //         console.log(`Records modified: ${modifiedCount}`);
    //         console.log(`Records skipped (no client-files/ prefix): ${processedCount - modifiedCount}`);

    //         return {
    //             success: true,
    //             totalProcessed: processedCount,
    //             totalModified: modifiedCount,
    //             totalSkipped: processedCount - modifiedCount
    //         };

    //     } catch (error) {
    //         console.error('Error in clientFilesMod endpoint:', error);
    //         return {
    //             success: false,
    //             error: error instanceof Error ? error.message : String(error)
    //         };
    //     }
    // }),
};
