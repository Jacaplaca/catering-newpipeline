import { OrderStatus } from '@prisma/client';
import { getNextWorkingDay } from '@root/app/specific/lib/dayInfo';
import { db } from '@root/app/server/db';

const removeWrongOrders = async () => {
    console.log("17 >>> removeWrongOrders...");
    const nextWorkingDay = getNextWorkingDay(new Date(), { timeZone: 'Europe/Warsaw' });
    const year = nextWorkingDay.getFullYear();
    const month = nextWorkingDay.getMonth();
    const day = nextWorkingDay.getDate();

    await db.order.deleteMany({
        where: {
            OR: [
                { deliveryDay: { is: { year: { gt: year } } } },
                {
                    AND: [
                        { deliveryDay: { is: { year: year } } },
                        { deliveryDay: { is: { month: { gt: month } } } }
                    ]
                },
                {
                    AND: [
                        { deliveryDay: { is: { year: year } } },
                        { deliveryDay: { is: { month: month } } },
                        { deliveryDay: { is: { day: { gt: day } } } }
                    ]
                },
                {
                    status: OrderStatus.draft,
                }
            ]
        },
    });
}


export default removeWrongOrders;