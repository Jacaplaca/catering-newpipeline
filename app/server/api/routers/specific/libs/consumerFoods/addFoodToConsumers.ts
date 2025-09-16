import { type RegularMenu, type Prisma } from '@prisma/client';
import getConsumers from '@root/app/server/api/routers/specific/libs/consumerFoods/getConsumers';
import getOriginalMenu from '@root/app/server/api/routers/specific/libs/consumerFoods/getOriginalMenu';

const removeConsumerFoods = async (
    tx: Prisma.TransactionClient,
    regularMenuId: string,
    consumers: { id: string }[],
) => {
    await tx.consumerFood.deleteMany({
        where: {
            regularMenuId,
            consumerId: { in: consumers.map(c => c.id) },
        },
    });
}

const assignConsumerFoods = async (
    tx: Prisma.TransactionClient,
    { menu, foods, consumers, cateringId }: { menu: RegularMenu, foods: { id: string; mealId: string }[], consumers: { id: string, clientId: string }[], cateringId: string }
) => {

    const consumerFoodsToCreate: Prisma.ConsumerFoodCreateManyInput[] = [];

    for (const food of foods) {
        for (const consumer of consumers) {
            consumerFoodsToCreate.push({
                cateringId,
                regularMenuId: menu.id,
                consumerId: consumer.id,
                foodId: food.id,
                mealId: food.mealId,
                clientId: consumer.clientId,
            });
        }
    }

    if (consumerFoodsToCreate.length > 0) {
        await tx.consumerFood.createMany({
            data: consumerFoodsToCreate,
        });
    }

}

const addFoodToConsumers = async (
    tx: Prisma.TransactionClient,
    { cateringId, menu, foods, update, consumerIds }: { cateringId: string, menu: RegularMenu, foods: { id: string; mealId: string }[], update?: boolean, consumerIds?: string[] }
) => {
    const consumers = await getConsumers(tx, { cateringId, clientId: menu.clientId, update, consumerIds, day: menu.day });

    if (consumers.length === 0) return;

    if (menu.clientId) {
        const { day } = menu;
        const originalMenu = await getOriginalMenu(tx, cateringId, day);
        if (originalMenu) {
            // Get existing consumer foods from original menu for this client's consumers
            const existingConsumerFoods = await tx.consumerFood.findMany({
                where: {
                    regularMenuId: originalMenu.id,
                    consumerId: { in: consumers.map(c => c.id) },
                },
                include: {
                    exclusions: {
                        include: {
                            exclusion: true,
                        },
                    },
                },
            });

            // Remove consumer foods from original menu
            await removeConsumerFoods(tx, originalMenu.id, consumers);

            // Create map of compatible assignments to transfer
            const transferableAssignments = new Map<string, {
                consumerId: string;
                foodId: string;
                alternativeFoodId: string | null;
                mealId: string;
                comment: string | null;
                exclusions: { exclusionId: string }[];
            }>();

            // Check which existing assignments can be transferred to new menu
            for (const existingFood of existingConsumerFoods) {
                const key = `${existingFood.consumerId}:${existingFood.mealId}`;
                const isCompatible = foods.some(newFood =>
                    newFood.mealId === existingFood.mealId &&
                    newFood.id === existingFood.foodId
                );

                if (isCompatible) {
                    transferableAssignments.set(key, {
                        consumerId: existingFood.consumerId,
                        foodId: existingFood.foodId,
                        alternativeFoodId: existingFood.alternativeFoodId,
                        mealId: existingFood.mealId,
                        comment: existingFood.comment,
                        exclusions: existingFood.exclusions.map(e => ({ exclusionId: e.exclusionId })),
                    });
                }
            }

            // Create consumer foods for new menu, preserving transferable assignments
            const consumerFoodsToCreate: Prisma.ConsumerFoodCreateManyInput[] = [];
            const consumerFoodExclusionsToCreate: { consumerFoodId: string; exclusionId: string }[] = [];

            for (const food of foods) {
                for (const consumer of consumers) {
                    const key = `${consumer.id}:${food.mealId}`;
                    const transferableData = transferableAssignments.get(key);

                    if (transferableData && transferableData.foodId === food.id) {
                        // Use existing assignment data
                        const consumerFood = await tx.consumerFood.create({
                            data: {
                                cateringId,
                                regularMenuId: menu.id,
                                consumerId: consumer.id,
                                foodId: transferableData.foodId,
                                alternativeFoodId: transferableData.alternativeFoodId,
                                mealId: transferableData.mealId,
                                clientId: consumer.clientId,
                                comment: transferableData.comment,
                            },
                        });

                        // Re-create exclusions for transferred assignment
                        for (const exclusion of transferableData.exclusions) {
                            consumerFoodExclusionsToCreate.push({
                                consumerFoodId: consumerFood.id,
                                exclusionId: exclusion.exclusionId,
                            });
                        }
                    } else {
                        // Create new assignment
                        consumerFoodsToCreate.push({
                            cateringId,
                            regularMenuId: menu.id,
                            consumerId: consumer.id,
                            foodId: food.id,
                            mealId: food.mealId,
                            clientId: consumer.clientId,
                        });
                    }
                }
            }

            // Create remaining new consumer foods (those without transferable data)
            if (consumerFoodsToCreate.length > 0) {
                await tx.consumerFood.createMany({
                    data: consumerFoodsToCreate,
                });
            }

            // Create exclusions for transferred assignments
            if (consumerFoodExclusionsToCreate.length > 0) {
                await tx.consumerFoodExclusion.createMany({
                    data: consumerFoodExclusionsToCreate,
                });
            }
        } else {
            // No original menu exists, create new assignments normally
            await assignConsumerFoods(tx, { menu, foods, consumers, cateringId });
        }
    } else {
        // This is a general menu (not client-specific), create assignments normally
        await assignConsumerFoods(tx, { menu, foods, consumers, cateringId });
    }
};

export {
    addFoodToConsumers,
    assignConsumerFoods,
}