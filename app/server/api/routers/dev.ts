// import { OrderStatus } from '@prisma/client';
import getCurrentTime from '@root/app/lib/date/getCurrentTime';
// import { getNextWorkingDay } from '@root/app/lib/date/getNextWorkingDay';
import autoOrder from '@root/app/server/lib/autoOrder';
import dbBackup from '@root/app/server/lib/makeBackup/backup';
import { publicProcedure } from "server/api/trpc";
import { z } from 'zod';
// import cleanCateringData from '@root/app/server/api/routers/specific/libs/devTools/cleanCateringDataWithClients';
// import copyCateringDataToOther from '@root/app/server/api/routers/specific/libs/devTools/copyCateringDataToOther';

/**
 * Clean all catering data except employees (managers, dieticians, kitchens)
 * Order of deletion is important due to foreign key constraints
 */


export const devRouter = {
    testAbc: publicProcedure.query(() => {
        return "Hello World!";
    }),
    test: publicProcedure.query(() => {
        return "Hello World!";
    }),
    backup: publicProcedure.query(async () => {
        const fileName = await dbBackup();
        return { backupFileName: fileName };
    }),
    autoOrder: publicProcedure.query(async () => {
        await autoOrder();
        return { autoOrder: 'success' };
    }),
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
};
