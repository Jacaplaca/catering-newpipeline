import { type Prisma } from '@prisma/client';

const saveExclusions = async (tx: Prisma.TransactionClient, { exclusionsMap, foods, regularMenuId, consumerIds, foodIds }: {
    exclusionsMap: Map<string, string[]>,
    foods: { id: string, mealId: string }[],
    regularMenuId: string,
    consumerIds: string[],
    foodIds: string[]
}) => {
    if (exclusionsMap.size > 0) {
        const mealIds = [...new Set(foods.map(f => f.mealId))];
        const createdConsumerFoods = await tx.consumerFood.findMany({
            where: {
                regularMenuId,
                foodId: { in: foodIds },
                consumerId: { in: consumerIds },
                mealId: { in: mealIds }
            },
            select: {
                id: true,
                foodId: true,
                consumerId: true,
                mealId: true
            }
        });

        const exclusionsToCreate: Prisma.ConsumerFoodExclusionCreateManyInput[] = [];

        for (const cf of createdConsumerFoods) {
            const key = `${cf.foodId}:${cf.consumerId}`;
            const exclusionIds = exclusionsMap.get(key);

            if (exclusionIds) {
                for (const exclusionId of exclusionIds) {
                    exclusionsToCreate.push({
                        consumerFoodId: cf.id,
                        exclusionId
                    });
                }
            }
        }

        if (exclusionsToCreate.length > 0) {
            await tx.consumerFoodExclusion.createMany({
                data: exclusionsToCreate
            });
        }
    }
}

export default saveExclusions;