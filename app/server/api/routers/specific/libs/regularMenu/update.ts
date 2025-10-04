import addMealFoodsToMenu from '@root/app/server/api/routers/specific/libs/menu/addMealFoodsToMenu';
import addFoodToConsumers from '@root/app/server/api/routers/specific/libs/consumerFoods/addFoodToConsumers';
import { db } from '@root/app/server/db';
import { TRPCError } from '@trpc/server';

const updateRegularMenu = async ({
    regularMenuId,
    cateringId,
    foods,
    day,
}: {
    regularMenuId: string;
    cateringId: string;
    foods: { id: string; mealId: string; order?: number, name?: string }[];
    day: { year: number; month: number; day: number };
}) => {
    return db.$transaction(async (tx) => {
        const clientMenu = await tx.regularMenu.findFirst({
            where: {
                id: regularMenuId,
                cateringId,
            },
        });

        if (!clientMenu) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Menu not found or you do not have permission to edit it.',
            });
        }

        const existingMenuMealFoods = await tx.menuMealFood.findMany({
            where: { regularMenuId },
            select: { id: true, foodId: true, mealId: true, order: true },
        });

        const existingFoodsSet = new Set(existingMenuMealFoods.map(f => `${f.foodId}:${f.mealId}`));
        const newFoodsSet = new Set(foods.map(f => `${f.id}:${f.mealId}`));

        const foodsToAdd = foods.filter(f => !existingFoodsSet.has(`${f.id}:${f.mealId}`));
        const foodsToRemove = existingMenuMealFoods.filter(f => !newFoodsSet.has(`${f.foodId}:${f.mealId}`));

        // Check if only order has changed (no additions/removals)
        const isOnlyOrderChange = foodsToAdd.length === 0 && foodsToRemove.length === 0;

        if (isOnlyOrderChange) {
            // Only update orders without deleting/adding records
            const orderUpdatePromises = foods
                .filter(food => food.order !== undefined)
                .map(food => {
                    const existingItem = existingMenuMealFoods.find(
                        existing => existing.foodId === food.id && existing.mealId === food.mealId
                    );

                    if (existingItem && existingItem.order !== food.order) {
                        return tx.menuMealFood.update({
                            where: { id: existingItem.id },
                            data: { order: food.order },
                        });
                    }
                    return null;
                })
                .filter(promise => promise !== null);

            if (orderUpdatePromises.length > 0) {
                await Promise.all(orderUpdatePromises);
            }
        }

        // Only perform add/remove operations if it's not just an order change
        if (!isOnlyOrderChange) {
            if (foodsToRemove.length > 0) {
                const removeConditions = foodsToRemove.map(f => ({ foodId: f.foodId, mealId: f.mealId }));

                await tx.consumerFood.deleteMany({
                    where: {
                        regularMenuId,
                        OR: removeConditions,
                    },
                });

                await tx.menuMealFood.deleteMany({
                    where: {
                        regularMenuId,
                        OR: removeConditions,
                    },
                });

                // Normalize order for remaining items - get all remaining menuMealFoods and reorder them
                const remainingMenuMealFoods = await tx.menuMealFood.findMany({
                    where: {
                        regularMenuId,
                    },
                    orderBy: [
                        { mealId: 'asc' },
                        { order: 'asc' },
                    ],
                });

                // Update order for remaining items to be sequential starting from 0
                const updateOrderPromises = remainingMenuMealFoods.map((item, index) =>
                    tx.menuMealFood.update({
                        where: {
                            id: item.id,
                        },
                        data: {
                            order: index,
                        },
                    })
                );

                await Promise.all(updateOrderPromises);
            }

            if (foodsToAdd.length > 0) {
                await addMealFoodsToMenu(tx, regularMenuId, foodsToAdd);
                await addFoodToConsumers(tx, { cateringId, menu: clientMenu, foods: foodsToAdd, update: true });
            }

            // Update order for existing items that weren't added or removed but have order changes
            const existingFoodsToUpdate = foods
                .filter(food =>
                    food.order !== undefined &&
                    !foodsToAdd.some(addedFood => addedFood.id === food.id && addedFood.mealId === food.mealId)
                )
                .map(food => {
                    const existingItem = existingMenuMealFoods.find(
                        existing => existing.foodId === food.id && existing.mealId === food.mealId
                    );

                    if (existingItem && existingItem.order !== food.order) {
                        return tx.menuMealFood.update({
                            where: { id: existingItem.id },
                            data: { order: food.order },
                        });
                    }
                    return null;
                })
                .filter(promise => promise !== null);

            if (existingFoodsToUpdate.length > 0) {
                await Promise.all(existingFoodsToUpdate);
            }
        }

        const regularMenu = await tx.regularMenu.update({
            where: { id: regularMenuId },
            data: { day },
        });

        return regularMenu;
    });
}

export default updateRegularMenu;