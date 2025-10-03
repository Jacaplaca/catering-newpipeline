import cron from 'node-cron';
import { db } from '@root/app/server/db';
import getCurrentTime from '@root/app/lib/date/getCurrentTime';
// import isWorkingDay from '@root/app/specific/lib/isWorkingDay';
import { getNextWorkingDay } from '@root/app/specific/lib/dayInfo';
import { OrderStatus } from '@prisma/client';
import getClientSettings from '@root/app/server/api/routers/specific/libs/getUserSettings';
import getDeadlinesStatus from '@root/app/specific/lib/getDeadlinesStatus';
import { getSetting } from '@root/app/server/cache/settings';

// const withWeekend = 'cm414l1ud0008t48ia51eyqc9';
// const withoutWeekend = 'cm6163n9v006hph0jthdwqc3h';
// const allCases = [withWeekend, withoutWeekend];


async function autoOrder() {
    // return;
    // console.log('>>>>>>>>>>>>>>>>>>Auto order process started');
    const clients = await db.client.findMany({
        where: { deactivated: { not: true } },
        include: { catering: true },
    });

    // Asynchronously iterate over each client
    for (const client of clients) {

        // const { firstOrderDeadline: clientFirstOrderDeadline } = client.info;
        // break;
        const now = getCurrentTime();
        // const tommorow = new Date();
        // tommorow.setDate(tommorow.getDate() + 1);
        // const nowYear = now.getFullYear();
        // const nowMonth = now.getMonth();
        // const nowDay = now.getDate();

        const nextWorkingDay = getNextWorkingDay(now, client.catering.settings);
        const nextWorkingDayYear = nextWorkingDay.getFullYear();
        const nextWorkingDayMonth = nextWorkingDay.getMonth();
        const nextWorkingDayDay = nextWorkingDay.getDate();

        const settings = await getClientSettings({
            clientId: client.id,
            userId: client.userId,
            cateringSettings: client.catering.settings,
        });

        const deadlinesStatus = getDeadlinesStatus({ settings, day: { year: nextWorkingDayYear, month: nextWorkingDayMonth, day: nextWorkingDayDay } });
        const { isBetween } = deadlinesStatus;
        // console.log(now);
        // allCases.includes(client.id) && console.log(client.id, now, deadlinesStatus);


        if (!isBetween) {
            // console.log(`Client: ${client.id}, is not a working day`);
            continue;
        }


        // const firstOrderDeadline = clientFirstOrderDeadline ? clientFirstOrderDeadline : cateringFirstOrderDeadline;
        // // const secondOrderDeadline = clientSecondOrderDeadline ? clientSecondOrderDeadline : cateringSecondOrderDeadline;

        // const [firstDeadlineHour, firstDeadlineMinute] = firstOrderDeadline.split(':').map(Number);
        // // const [secondDeadlineHour, secondDeadlineMinute] = secondOrderDeadline.split(':').map(Number);


        // const firstDeadlineDate = new Date(nowYear, nowMonth, nowDay, firstDeadlineHour, firstDeadlineMinute);
        // // const secondDeadlineDate = new Date(nowYear, nowMonth, nowDay, secondDeadlineHour, secondDeadlineMinute);

        // update all orders associated with the current client
        await db.order.updateMany({
            where: {
                cateringId: client.catering.id,
                clientId: client.id,
                status: OrderStatus.in_progress,
                OR: [
                    { deliveryDay: { is: { year: { lt: now.getFullYear() } } } },
                    {
                        AND: [
                            { deliveryDay: { is: { year: now.getFullYear() } } },
                            { deliveryDay: { is: { month: { lt: now.getMonth() } } } }
                        ]
                    },
                    {
                        AND: [
                            { deliveryDay: { is: { year: now.getFullYear() } } },
                            { deliveryDay: { is: { month: now.getMonth() } } },
                            { deliveryDay: { is: { day: { lt: now.getDate() } } } }
                        ]
                    }
                ]
            },
            data: {
                status: OrderStatus.completed,
            }
        });

        const latestOrder = await db.order.findFirst({
            where: {
                cateringId: client.catering.id,
                clientId: client.id,
                status: { not: OrderStatus.draft },
                OR: [
                    { deliveryDay: { is: { year: { lt: now.getFullYear() } } } },
                    {
                        AND: [
                            { deliveryDay: { is: { year: now.getFullYear() } } },
                            { deliveryDay: { is: { month: { lt: now.getMonth() } } } }
                        ]
                    },
                    {
                        AND: [
                            { deliveryDay: { is: { year: now.getFullYear() } } },
                            { deliveryDay: { is: { month: now.getMonth() } } },
                            { deliveryDay: { is: { day: { lte: now.getDate() } } } }
                        ]
                    }
                ]
            },
            orderBy: [
                { deliveryDay: { year: 'desc' } },
                { deliveryDay: { month: 'desc' } },
                { deliveryDay: { day: 'desc' } },
            ],
        });



        if (latestOrder) {
            const nextWorkingDayOrder = await db.order.findFirst({
                where: {
                    cateringId: client.catering.id,
                    clientId: client.id,
                    deliveryDay: {
                        year: nextWorkingDayYear,
                        month: nextWorkingDayMonth,
                        day: nextWorkingDayDay
                    }
                }
            })
            // client.id === 'cm414l1ud0008t48ia51eyqc9'
            //     && console.log({
            //         latestOrder: latestOrder?.deliveryDay,
            //         nextWorkingDay,
            //         nextWorkingDayOrder,
            //     });

            const { id: latestOrderId, ...latestOrderData } = latestOrder;
            // console.log(`
            //         ${firstOrderDeadline} passed
            //         NWD: ${nextWorkingDayYear}-${nextWorkingDayMonth + 1}-${nextWorkingDayDay}
            //         Cl: ${client.id},
            //         Or: ${latestOrderId},
            //         ${latestOrderData.deliveryDay.year}-${latestOrderData.deliveryDay.month}-${latestOrderData.deliveryDay.day}`);

            // Porównujemy deliveryDay z nextWorkingDay
            if (nextWorkingDayOrder) {
                // console.log(`We have an order on the next working day`);
                continue;
            } else {
                // console.log(`We don't have an order on the next working day, creating a new one ${nextWorkingDay.getFullYear()}-${nextWorkingDay.getMonth()}-${nextWorkingDay.getDate()}`);

                // const orderForNextDay = await db.order.findFirst({
                //     where: {
                //         cateringId: client.catering.id,
                //         clientId: client.id,
                //         deliveryDay: {
                //             year: nextWorkingDay.getFullYear(),
                //             month: nextWorkingDay.getMonth(),
                //             day: nextWorkingDay.getDate(),
                //         }
                //     }
                // });

                // if (!orderForNextDay) {
                //     continue;
                // };


                // console.log(`We don't have an order on the next working day, creating a new one`);
                const breakfastPromise = db.orderConsumerBreakfast.findMany({
                    where: {
                        orderId: latestOrderId,
                    },
                });

                const lunchPromise = db.orderConsumerLunch.findMany({
                    where: {
                        orderId: latestOrderId,
                    },
                });

                const dinnerPromise = db.orderConsumerDinner.findMany({
                    where: {
                        orderId: latestOrderId,
                    },
                });

                const [breakfast, lunch, dinner] = await Promise.all([breakfastPromise, lunchPromise, dinnerPromise]);
                // console.log(`Breakfast: ${JSON.stringify(breakfast)}`);
                // console.log(`Lunch: ${JSON.stringify(lunch)}`);
                // console.log(`Dinner: ${JSON.stringify(dinner)}`);

                const newOrder = await db.order.create({
                    data: {
                        ...latestOrderData,
                        deliveryDay: {
                            year: nextWorkingDay.getFullYear(),
                            month: nextWorkingDay.getMonth(),
                            day: nextWorkingDay.getDate(),
                        },
                        status: OrderStatus.in_progress,
                        lunchStandardBeforeDeadline: latestOrderData.lunchStandard,
                        dinnerStandardBeforeDeadline: latestOrderData.dinnerStandard,
                        lunchDietCountBeforeDeadline: lunch.length,
                        dinnerDietCountBeforeDeadline: dinner.length,
                        sentToCateringAt: now,
                    },
                });

                // console.log(`New order created: ${JSON.stringify(newOrder)}`);

                const promises = [];

                // Add breakfast data only if breakfast is a non-empty array
                if (Array.isArray(breakfast) && breakfast.length > 0) {
                    const newBreakfastPromise = db.orderConsumerBreakfast.createMany({
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        data: breakfast.map(({ id, ...rest }) => ({
                            ...rest,
                            orderId: newOrder.id,
                        })),
                    });
                    promises.push(newBreakfastPromise);
                }

                // Add lunch data only if lunch is a non-empty array
                if (Array.isArray(lunch) && lunch.length > 0) {
                    const newLunchPromise = db.orderConsumerLunch.createMany({
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        data: lunch.map(({ id, ...rest }) => ({
                            ...rest,
                            orderId: newOrder.id,
                        })),
                    });
                    promises.push(newLunchPromise);

                    const newLunchBeforeDeadlinePromise = db.orderConsumerLunchBeforeDeadline.createMany({
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        data: lunch.map(({ id, ...rest }) => ({
                            ...rest,
                            orderId: newOrder.id,
                        })),
                    });
                    promises.push(newLunchBeforeDeadlinePromise);
                }

                // Add dinner data only if dinner is a non-empty array
                if (Array.isArray(dinner) && dinner.length > 0) {
                    const newDinnerPromise = db.orderConsumerDinner.createMany({
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        data: dinner.map(({ id, ...rest }) => ({
                            ...rest,
                            orderId: newOrder.id,
                        })),
                    });
                    promises.push(newDinnerPromise);

                    const newDinnerBeforeDeadlinePromise = db.orderConsumerDinnerBeforeDeadline.createMany({
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        data: dinner.map(({ id, ...rest }) => ({
                            ...rest,
                            orderId: newOrder.id,
                        })),
                    });
                    promises.push(newDinnerBeforeDeadlinePromise);
                }

                await Promise.all(promises);
            }

        }




        // // Fetch all orders associated with the current client
        // const orders = await db.order.findMany({
        //     where: { clientId: client.id },
        // });

        // if (orders.length === 0) {
        //     console.log(`No orders found for client: ${client.id}`);
        //     continue;
        // }

        // // Sort orders by deliveryDay in descending order
        // const latestOrder = orders.sort((a, b) => {
        //     const dateA = a.deliveryDay.year * 10000 + a.deliveryDay.month * 100 + a.deliveryDay.day;
        //     const dateB = b.deliveryDay.year * 10000 + b.deliveryDay.month * 100 + b.deliveryDay.day;
        //     return dateB - dateA;
        // })[0];

        // console.log(`Client: ${client.id}, Latest Order: ${latestOrder.deliveryDay.year}-${latestOrder.deliveryDay.month}-${latestOrder.deliveryDay.day}`);
    }
}

async function initAutoOrderCron() {
    const cronAutoOrder = await getSetting<string>('auto-order', 'cron');
    const shouldAutoOrder = await getSetting<boolean>('auto-order', 'should-auto-order');
    cron.schedule(cronAutoOrder, () => {
        if (shouldAutoOrder) {
            void autoOrder();
        }
    });
}

export default initAutoOrderCron;