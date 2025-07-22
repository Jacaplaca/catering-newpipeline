import { db } from '@root/app/server/db';
import { getLastOrderValid, getOrderValid, orderForTableValid } from '@root/app/validators/specific/order';
import { type OrdersCustomTable, type OrderForView } from '@root/types/specific';
import getOrderDbQuery from '@root/app/server/api/routers/specific/libs/getOrdersDbQuery';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { options } from '@root/app/server/api/specific/aggregate';
import getOrder from '@root/app/server/api/routers/specific/libs/getOrder';
import { OrderStatus, RoleType } from '@prisma/client';
import getCurrentTime from '@root/app/lib/date/getCurrentTime';

const forView = createCateringProcedure([RoleType.manager, RoleType.kitchen])
    .input(getOrderValid)
    .query(async ({ input, ctx }) => {
        const { session: { catering } } = ctx;
        const cateringId = catering.id;
        const { id: orderId } = input;

        const result = await db.order.aggregateRaw({
            pipeline: [
                { $match: { _id: orderId, cateringId } },
                {
                    $lookup: {
                        from: 'OrderConsumerBreakfast',
                        localField: '_id',
                        foreignField: 'orderId',
                        as: 'breakfastDiet'
                    }
                },
                {
                    $lookup: {
                        from: 'OrderConsumerLunch',
                        localField: '_id',
                        foreignField: 'orderId',
                        as: 'lunchDiet'
                    }
                },
                {
                    $lookup: {
                        from: 'OrderConsumerDinner',
                        localField: '_id',
                        foreignField: 'orderId',
                        as: 'dinnerDiet'
                    }
                },
                {
                    $lookup: {
                        from: 'OrderConsumerLunchBeforeDeadline',
                        localField: '_id',
                        foreignField: 'orderId',
                        as: 'lunchDietBeforeDeadline'
                    }
                },
                {
                    $lookup: {
                        from: 'OrderConsumerDinnerBeforeDeadline',
                        localField: '_id',
                        foreignField: 'orderId',
                        as: 'dinnerDietBeforeDeadline'
                    }
                },
                {
                    $lookup: {
                        from: 'Consumer',
                        let: {
                            breakfastIds: '$breakfastDiet.consumerId',
                            lunchIds: '$lunchDiet.consumerId',
                            dinnerIds: '$dinnerDiet.consumerId',
                            lunchBeforeDeadlineIds: '$lunchDietBeforeDeadline.consumerId',
                            dinnerBeforeDeadlineIds: '$dinnerDietBeforeDeadline.consumerId'
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $or: [
                                            { $in: ['$_id', '$$breakfastIds'] },
                                            { $in: ['$_id', '$$lunchIds'] },
                                            { $in: ['$_id', '$$dinnerIds'] },
                                            { $in: ['$_id', '$$lunchBeforeDeadlineIds'] },
                                            { $in: ['$_id', '$$dinnerBeforeDeadlineIds'] }
                                        ]
                                    }
                                }
                            },
                            {
                                $lookup: {
                                    from: 'Diet',
                                    localField: 'dietId',
                                    foreignField: '_id',
                                    as: 'diet'
                                }
                            },
                            { $unwind: { path: '$diet', preserveNullAndEmptyArrays: true } },
                            {
                                $project: {
                                    id: '$_id',
                                    _id: 0,
                                    name: 1,
                                    code: 1,
                                    diet: {
                                        $cond: {
                                            if: { $ifNull: ['$diet', false] },
                                            then: {
                                                id: '$diet._id',
                                                code: '$diet.code',
                                                notes: '$diet.notes',
                                                description: '$diet.description'
                                            },
                                            else: null
                                        }
                                    }
                                }
                            }
                        ],
                        as: 'consumers'
                    }
                },
                {
                    $project: {
                        id: '$_id',
                        standards: {
                            breakfast: '$breakfastStandard',
                            lunch: '$lunchStandard',
                            dinner: '$dinnerStandard'
                        },
                        standardsBeforeDeadline: {
                            lunch: '$lunchStandardBeforeDeadline',
                            dinner: '$dinnerStandardBeforeDeadline'
                        },
                        diet: {
                            breakfast: {
                                $filter: {
                                    input: '$consumers',
                                    as: 'consumer',
                                    cond: { $in: ['$$consumer.id', '$breakfastDiet.consumerId'] }
                                }
                            },
                            lunch: {
                                $filter: {
                                    input: '$consumers',
                                    as: 'consumer',
                                    cond: { $in: ['$$consumer.id', '$lunchDiet.consumerId'] }
                                }
                            },
                            dinner: {
                                $filter: {
                                    input: '$consumers',
                                    as: 'consumer',
                                    cond: { $in: ['$$consumer.id', '$dinnerDiet.consumerId'] }
                                }
                            }
                        },
                        dietBeforeDeadline: {
                            lunch: {
                                $filter: {
                                    input: '$consumers',
                                    as: 'consumer',
                                    cond: { $in: ['$$consumer.id', '$lunchDietBeforeDeadline.consumerId'] }
                                }
                            },
                            dinner: {
                                $filter: {
                                    input: '$consumers',
                                    as: 'consumer',
                                    cond: { $in: ['$$consumer.id', '$dinnerDietBeforeDeadline.consumerId'] }
                                }
                            }
                        },
                        day: '$deliveryDay',
                        notes: 1,
                    }
                },
                {
                    $project: {
                        id: 1,
                        status: 1,
                        standards: 1,
                        standardsBeforeDeadline: 1,
                        dietBeforeDeadline: 1,
                        diet: 1,
                        notes: 1,
                        day: {
                            year: '$day.year',
                            month: '$day.month',
                            day: '$day.day'
                        }
                    }
                }
            ]
        });

        if (!Array.isArray(result) || result.length === 0) {
            throw new Error('orders:order_not_found');
        }

        const rawOrder = result[0] as unknown as OrderForView;

        return rawOrder;
    });

const forEdit = createCateringProcedure([RoleType.client, RoleType.manager])
    .input(getOrderValid)
    .query(async ({ input, ctx }) => {
        const { session: { catering } } = ctx;
        const cateringId = catering.id;
        const { id: orderId } = input;

        return getOrder({ orderId, cateringId });
    });

const last = createCateringProcedure([RoleType.client])
    .input(getLastOrderValid)
    .query(async ({ input, ctx }) => {
        const { session: { catering } } = ctx;
        const cateringId = catering.id;
        const { clientId } = input;
        const today = getCurrentTime();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); // 0-11
        const currentDay = today.getDate();

        const lastOrder = await db.order.findFirst({
            where: {
                cateringId,
                clientId,
                status: { not: OrderStatus.draft },
                OR: [
                    { deliveryDay: { is: { year: { lt: currentYear } } } },
                    {
                        AND: [
                            { deliveryDay: { is: { year: currentYear } } },
                            { deliveryDay: { is: { month: { lt: currentMonth } } } }
                        ]
                    },
                    {
                        AND: [
                            { deliveryDay: { is: { year: currentYear } } },
                            { deliveryDay: { is: { month: currentMonth } } },
                            { deliveryDay: { is: { day: { lt: currentDay } } } }
                        ]
                    }
                ]
            },
            orderBy: [
                { deliveryDay: { year: 'desc' } },
                { deliveryDay: { month: 'desc' } },
                { deliveryDay: { day: 'desc' } }
            ],
            select: {
                id: true,
            }
        });


        if (!lastOrder) {
            // throw new Error('orders:no_orders_found');
            return null;
        }

        return getOrder({ orderId: lastOrder.id, onlyActiveConsumers: true });
    });

const forTable = createCateringProcedure([RoleType.manager, RoleType.kitchen, RoleType.client])
    .input(orderForTableValid)
    .query(async ({ input, ctx }) => {
        const { session: { catering } } = ctx;
        const { id } = input;

        const pipeline = [
            ...getOrderDbQuery({
                id,
                catering,
                // full: true
            }),
        ]

        const orders = await db.order.aggregateRaw({
            pipeline,
            options
        }) as unknown as OrdersCustomTable[];

        return orders[0];
    });

const getOne = {
    forEdit,
    forTable,
    forView,
    last
};

export default getOne;
