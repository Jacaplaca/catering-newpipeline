import { db } from '@root/app/server/db';
import { type OrderForEdit } from '@root/types/specific';

const getOrder = async ({ orderId, cateringId, onlyActiveConsumers }: { orderId: string, cateringId?: string, onlyActiveConsumers?: boolean }) => {

    type MatchObject = {
        cateringId?: string;
        _id?: string;
    };

    const match: MatchObject = {}

    if (orderId) {
        match._id = orderId;
    }

    if (cateringId) {
        match.cateringId = cateringId;
    }

    // Helper function to create lookup stage for order consumers.
    const createLookupStage = (fromCollection: string, asName: string) => {
        if (onlyActiveConsumers) {
            return {
                $lookup: {
                    from: fromCollection,
                    let: { orderId: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$orderId", "$$orderId"] } } },
                        {
                            $lookup: {
                                from: 'Consumer',
                                localField: 'consumerId',
                                foreignField: '_id',
                                as: 'consumer'
                            }
                        },
                        { $unwind: "$consumer" },
                        { $match: { "consumer.deactivated": { $ne: true } } },
                        { $project: { consumerId: 1 } }
                    ],
                    as: asName
                }
            };
        } else {
            return {
                $lookup: {
                    from: fromCollection,
                    localField: '_id',
                    foreignField: 'orderId',
                    as: asName
                }
            };
        }
    };

    const pipeline = [
        { $match: match },
        createLookupStage('OrderConsumerBreakfast', 'breakfastDiet'),
        createLookupStage('OrderConsumerLunch', 'lunchDiet'),
        createLookupStage('OrderConsumerDinner', 'dinnerDiet'),
        createLookupStage('OrderConsumerLunchBeforeDeadline', 'lunchDietBeforeDeadline'),
        createLookupStage('OrderConsumerDinnerBeforeDeadline', 'dinnerDietBeforeDeadline'),
        {
            $project: {
                id: '$_id',
                status: 1,
                clientId: 1,
                standards: {
                    breakfast: '$breakfastStandard',
                    lunch: '$lunchStandard',
                    dinner: '$dinnerStandard'
                },
                diet: {
                    breakfast: '$breakfastDiet.consumerId',
                    lunch: '$lunchDiet.consumerId',
                    dinner: '$dinnerDiet.consumerId'
                },
                dietBeforeDeadline: {
                    lunch: '$lunchDietBeforeDeadline.consumerId',
                    dinner: '$dinnerDietBeforeDeadline.consumerId'
                },
                standardsBeforeDeadline: {
                    lunch: '$lunchStandardBeforeDeadline',
                    dinner: '$dinnerStandardBeforeDeadline'
                },
                day: '$deliveryDay',
                notes: 1,
            }
        },
        {
            $project: {
                id: 1,
                clientId: 1,
                status: 1,
                standards: 1,
                diet: 1,
                dietBeforeDeadline: 1,
                standardsBeforeDeadline: 1,
                notes: 1,
                day: {
                    year: '$day.year',
                    month: '$day.month',
                    day: '$day.day'
                }
            }
        }
    ];

    const result = await db.order.aggregateRaw({ pipeline });

    if (!Array.isArray(result) || result.length === 0) {
        throw new Error('orders:order_not_found');
    }

    const rawOrder = result[0] as unknown as OrderForEdit;

    return rawOrder;
}

export default getOrder;