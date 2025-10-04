import { type ConsumerFood, type Prisma } from '@prisma/client';

type ConsumerFoodWithExclusions = ConsumerFood & {
    exclusions?: Array<{ exclusionId: string }>;
};

const getConsumerFoods = async (tx: Prisma.TransactionClient, { consumerIds, foodIds }: { consumerIds: string[], foodIds: string[] }) => {
    const pipeline = [
        {
            $match: {
                consumerId: { $in: consumerIds },
                foodId: { $in: foodIds }
            }
        },
        {
            $lookup: {
                from: 'ConsumerFoodExclusion',
                localField: '_id',
                foreignField: 'consumerFoodId',
                as: 'exclusionsList'
            }
        },
        {
            $match: {
                $or: [
                    { alternativeFoodId: { $ne: null } },
                    { comment: { $nin: [null, ""] } },
                    { exclusionsList: { $ne: [] } }
                ]
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $group: {
                _id: {
                    foodId: '$foodId',
                    consumerId: '$consumerId'
                },
                latestDocument: {
                    $first: {
                        _id: '$_id',
                        foodId: '$foodId',
                        consumerId: '$consumerId',
                        alternativeFoodId: '$alternativeFoodId',
                        comment: '$comment',
                        hasExclusions: { $gt: [{ $size: '$exclusionsList' }, 0] },
                        exclusions: '$exclusionsList',
                        mealId: '$mealId',
                        regularMenuId: '$regularMenuId',
                        clientId: '$clientId',
                        cateringId: '$cateringId',
                        ignoredAllergens: '$ignoredAllergens',
                        createdAt: '$createdAt',
                        updatedAt: '$updatedAt'
                    }
                }
            }
        },
        {
            $group: {
                _id: '$_id.foodId',
                consumers: {
                    $push: {
                        k: '$_id.consumerId',
                        v: '$latestDocument'
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                foodId: '$_id',
                consumers: { $arrayToObject: '$consumers' }
            }
        },
        {
            $group: {
                _id: null,
                foods: {
                    $push: {
                        k: '$foodId',
                        v: '$consumers'
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                result: { $arrayToObject: '$foods' }
            }
        }
    ];

    const result = await tx.consumerFood.aggregateRaw({
        pipeline,
    }) as unknown as { result: Record<string, Record<string, ConsumerFoodWithExclusions | null>> }[];

    return result?.[0]?.result;
}

export default getConsumerFoods;