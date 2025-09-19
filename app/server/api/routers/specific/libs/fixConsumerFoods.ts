import { type MenuMealFood, type RegularMenu } from '@prisma/client';
import { addFoodToConsumers } from '@root/app/server/api/routers/specific/libs/consumerFoods/addFoodToConsumers';
import { db } from '@root/app/server/db';

const fixConsumerFoods = async (menu: RegularMenu, menuMealFoods: MenuMealFood[], clientId: string, cateringId: string, menuId: string) => {

    const consumers = await db.consumer.findMany({
        where: {
            clientId,
            cateringId,
            deactivated: { not: true },
        },
    });

    let consumerFoods = await db.consumerFood.findMany({
        where: {
            regularMenuId: menuId,
            clientId,
            cateringId,
        },
    });

    if (consumers.length * menuMealFoods.length === consumerFoods.length) {
        return
    }

    // Create object showing missing menuMealFoods per user
    const missingFoodsPerUser: Record<string, MenuMealFood[]> = {};

    // For each consumer, check which menuMealFoods they're missing
    consumers.forEach(consumer => {
        const userConsumerFoods = consumerFoods.filter(cf => cf.consumerId === consumer.id);

        // Find missing menuMealFoods by comparing foodId and mealId combinations
        const missingMenuMealFoods = menuMealFoods.filter(mmf => {
            return !userConsumerFoods.some(cf =>
                cf.foodId === mmf.foodId && cf.mealId === mmf.mealId
            );
        });

        if (missingMenuMealFoods.length > 0) {
            missingFoodsPerUser[consumer.id] = missingMenuMealFoods;
        }
    });

    for (const consumerId in missingFoodsPerUser) {
        const mealFoods = missingFoodsPerUser[consumerId];
        if (mealFoods && mealFoods.length > 0) {
            const foods = mealFoods.map(m => ({
                id: m.foodId,
                mealId: m.mealId,
            }));
            await db.$transaction(async (tx) => {
                await addFoodToConsumers(tx, { cateringId, menu, foods, consumerIds: [consumerId] });
            });
        }
    }

    consumerFoods = await db.consumerFood.findMany({
        where: {
            regularMenuId: menuId,
            clientId,
            cateringId,
        },
    });

    const consumersWithMenuIds = [...new Set(consumerFoods.map(assignment => assignment.consumerId))];
    // Check for missing meal assignments for current client
    const uniqueMealIds = [...new Set(menuMealFoods.map(m => m.mealId))];
    const existingMealIds = [...new Set(consumerFoods.map(cf => cf.mealId))];
    const missingMealIds = uniqueMealIds.filter(mealId => !existingMealIds.includes(mealId));
    if (missingMealIds.length > 0) {
        const foods = menuMealFoods.filter(m => missingMealIds.includes(m.mealId)).map(m => ({
            id: m.foodId,
            mealId: m.mealId,
        }));
        await db.$transaction(async (tx) => {
            await addFoodToConsumers(tx, { cateringId, menu, foods, consumerIds: consumersWithMenuIds });
        });
    }

    const currentConsumerIds = consumers.map(consumer => consumer.id);
    const newConsumerIds = currentConsumerIds.filter(id => !consumersWithMenuIds.includes(id));
    if (newConsumerIds.length > 0) {
        const foods = menuMealFoods.map(m => ({
            id: m.foodId,
            mealId: m.mealId,
        }));
        await db.$transaction(async (tx) => {
            await addFoodToConsumers(tx, { cateringId, menu, foods, consumerIds: newConsumerIds });
        });
    }


}

export default fixConsumerFoods;