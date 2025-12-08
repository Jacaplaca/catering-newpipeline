import { env } from '@root/app/env';
import { getSetting } from '@root/app/server/cache/settings';
import { db } from '@root/app/server/db';
import getCutoffDate from '@root/app/server/lib/cutoffDate';
import cron from 'node-cron';
import logger from '@root/app/lib/logger';

const isProduction = env.NODE_ENV === 'production';

async function cleanupOrders() {
        logger.info('>>>>>>>>>>>>>>>>>>Orders cleanup process started');
        const oldMonths = await getSetting<number>('cleanup', 'order-old-months');

        if (oldMonths == null || oldMonths < 0) {
                return;
        }

        const { cutoffYear, cutoffMonth } = getCutoffDate({ months: oldMonths });

        try {
                const oldOrdersResult = await db.order.aggregateRaw({
                        pipeline: [
                                {
                                        $match: {
                                                $or: [
                                                        {
                                                                "deliveryDay.year": { $lt: cutoffYear }
                                                        },
                                                        {
                                                                $and: [
                                                                        { "deliveryDay.year": cutoffYear },
                                                                        { "deliveryDay.month": { $lt: cutoffMonth } }
                                                                ]
                                                        }
                                                ]
                                        }
                                },
                                {
                                        $project: {
                                                id: "$_id",
                                                deliveryDay: 1,
                                                clientId: 1,
                                                cateringId: 1
                                        }
                                }
                        ]
                });

                const oldOrders = oldOrdersResult as unknown as Array<{
                        id: string;
                        deliveryDay: { year: number; month: number; day: number };
                        clientId: string;
                        cateringId: string;
                }>;

                if (oldOrders.length === 0) {
                        return;
                }

                const orderIds = oldOrders.map(order => order.id);

                // Delete old orders - cascade will automatically delete all related records
                await db.order.deleteMany({
                        where: {
                                id: {
                                        in: orderIds
                                }
                        }
                });

                logger.info(`Orders cleanup: cutoff ${cutoffYear}-${cutoffMonth + 1}, deleted ${oldOrders.length} orders`);

        } catch (error) {
                logger.error(`Error during cleanup operation: ${error}`);
        }
}

// Initialize cron job asynchronously
async function initCleanupCron() {
        const cronSchedule = await getSetting<string>('cleanup', 'order-cron');
        const shouldCleanup = await getSetting<boolean>('cleanup', 'order-should-delete');
        cron.schedule(cronSchedule, () => {
                if (shouldCleanup && isProduction) {
                        void cleanupOrders();
                }
        });
}

// Start the cron job when module loads
export default initCleanupCron;