import { type OrderConsumerBreakfast, type DeliveryRoute, type OrderConsumerDinner, type OrderConsumerLunch, type OrderStatus, type Client } from '@prisma/client';
import { type OrderMealPopulated } from '@root/types/specific';
import { db } from '@root/app/server/db';

export type DayOrder = {
    _id: string;
    client: Client;
    status: OrderStatus;
    sentToCateringAt: { $date: Date };
    breakfastStandard: number;
    lunchStandard: number;
    dinnerStandard: number;
    breakfastDiet: (OrderConsumerBreakfast & OrderMealPopulated)[];
    lunchDiet: (OrderConsumerLunch & OrderMealPopulated)[];
    dinnerDiet: (OrderConsumerDinner & OrderMealPopulated)[];
    deliveryRoute?: DeliveryRoute;
};

const getDayOrders = async (dayId: string, cateringId: string) => {
    const [year, month, day] = dayId.split('-').map(Number);

    return await db.order.aggregateRaw({
        pipeline: [
            {
                $match: {
                    cateringId,
                    status: { $ne: 'draft' },
                    deliveryDay: {
                        year,
                        month,
                        day
                    }
                }
            },
            {
                $lookup: {
                    from: 'Client',
                    localField: 'clientId',
                    foreignField: '_id',
                    as: 'client'
                }
            },
            {
                $unwind: '$client'
            },
            {
                $lookup: {
                    from: 'DeliveryRoute',
                    localField: 'client.deliveryRouteId',
                    foreignField: '_id',
                    as: 'deliveryRoute'
                }
            },
            {
                $unwind: {
                    path: '$deliveryRoute',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'OrderConsumerBreakfast',
                    let: { orderId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$orderId', '$$orderId'] } } },
                        {
                            $lookup: {
                                from: 'Consumer',
                                localField: 'consumerId',
                                foreignField: '_id',
                                as: 'consumer'
                            }
                        },
                        { $unwind: '$consumer' }
                    ],
                    as: 'breakfastDiet'
                }
            },
            {
                $lookup: {
                    from: 'OrderConsumerLunch',
                    let: { orderId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$orderId', '$$orderId'] } } },
                        {
                            $lookup: {
                                from: 'Consumer',
                                localField: 'consumerId',
                                foreignField: '_id',
                                as: 'consumer'
                            }
                        },
                        { $unwind: '$consumer' }
                    ],
                    as: 'lunchDiet'
                }
            },
            {
                $lookup: {
                    from: 'OrderConsumerDinner',
                    let: { orderId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$orderId', '$$orderId'] } } },
                        {
                            $lookup: {
                                from: 'Consumer',
                                localField: 'consumerId',
                                foreignField: '_id',
                                as: 'consumer'
                            }
                        },
                        { $unwind: '$consumer' }
                    ],
                    as: 'dinnerDiet'
                }
            },
            {
                $project: {
                    _id: 1,
                    cateringId: 1,
                    clientId: 1,
                    client: 1,
                    status: 1,
                    breakfastStandard: 1,
                    lunchStandard: 1,
                    dinnerStandard: 1,
                    breakfastDietCount: 1,
                    lunchDietCount: 1,
                    dinnerDietCount: 1,
                    breakfastDiet: 1,
                    lunchDiet: 1,
                    dinnerDiet: 1,
                    deliveryDay: 1,
                    sentToCateringAt: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    deliveryRoute: 1
                }
            }
        ]
    }) as unknown as DayOrder[];
}

export default getDayOrders;
