import { type MenuMealFood, type RegularMenu } from '@prisma/client';
import { addFoodToConsumers } from '@root/app/server/api/routers/specific/libs/consumerFoods/addFoodToConsumers';
import { db } from '@root/app/server/db';

const queriesGen = (clientId: string, cateringId: string, menuId: string) => {
    const consumersQuery = {
        clientId,
        cateringId,
        deactivated: { not: true },
    }

    const consumerFoodsQuery = {
        regularMenuId: menuId,
        clientId,
        cateringId,
    }

    return {
        consumersQuery,
        consumerFoodsQuery,
    }
}

const getDBData = async (clientId: string, cateringId: string, menuId: string) => {
    const { consumersQuery, consumerFoodsQuery } = queriesGen(clientId, cateringId, menuId);
    const consumersPromise = db.consumer.findMany({
        where: consumersQuery,
    });

    const consumerFoodsPromise = db.consumerFood.findMany({
        where: consumerFoodsQuery,
    });

    return Promise.all([consumersPromise, consumerFoodsPromise]);
}

const fixMissingConsumerFoods = async (menu: RegularMenu, { clientId, cateringId, menuId, menuMealFoods }: { clientId: string, cateringId: string, menuId: string, menuMealFoods: MenuMealFood[] }) => {
    // console.log('fixMissingConsumerFoods');
    const [consumers, consumerFoods] = await getDBData(clientId, cateringId, menuId);

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
    // console.log('missingFoodsPerUser', missingFoodsPerUser);

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
}

const fixExtraConsumerFoods = async (menu: RegularMenu, { clientId, cateringId, menuId, menuMealFoods }: { clientId: string, cateringId: string, menuId: string, menuMealFoods: MenuMealFood[] }) => {
    // console.log('fixExtraConsumerFoods');

    // Step 1: Delete ConsumerFood for deactivated consumers
    await db.consumerFood.deleteMany({
        where: {
            regularMenuId: menuId,
            clientId,
            cateringId,
            consumer: {
                deactivated: true
            }
        }
    });
    // console.log(`Deleted ${deletedDeactivatedResult.count} ConsumerFood records for deactivated consumers`);

    // Step 2: Delete ConsumerFood with invalid mealId/foodId combinations
    // Create valid combinations set for efficient lookup
    const validCombinations = new Set(
        menuMealFoods.map(mmf => `${mmf.mealId}_${mmf.foodId}`)
    );

    // Get all existing ConsumerFood records for this menu
    const existingConsumerFoods = await db.consumerFood.findMany({
        where: {
            regularMenuId: menuId,
            clientId,
            cateringId,
            // consumer: {
            //     deactivated: { not: true } // Only active consumers now
            // }
        },
        select: {
            id: true,
            mealId: true,
            foodId: true
        }
    });

    // Find ConsumerFood records with invalid combinations
    const invalidConsumerFoodIds = existingConsumerFoods
        .filter(cf => !validCombinations.has(`${cf.mealId}_${cf.foodId}`))
        .map(cf => cf.id);

    if (invalidConsumerFoodIds.length > 0) {
        await db.consumerFood.deleteMany({
            where: {
                id: {
                    in: invalidConsumerFoodIds
                }
            }
        });
        // console.log(`Deleted ${deletedInvalidResult.count} ConsumerFood records with invalid mealId/foodId combinations`);
    } else {
        // console.log('No invalid ConsumerFood combinations found');
    }
}


const fixConsumerFoods = async (menu: RegularMenu, menuMealFoods: MenuMealFood[], clientId: string, cateringId: string, menuId: string) => {

    const { consumersQuery, consumerFoodsQuery } = queriesGen(clientId, cateringId, menuId);

    const consumersCountPromise = db.consumer.count({
        where: consumersQuery,
    });

    const consumerFoodsCountPromise = db.consumerFood.count({
        where: consumerFoodsQuery,
    });

    const [consumersCount, consumerFoodsCount] = await Promise.all([consumersCountPromise, consumerFoodsCountPromise]);
    // console.log('consumerFoodsCount', consumerFoodsCount);
    // console.log('consumersCount', consumersCount);
    // console.log('menuMealFoods', menuMealFoods.length);

    if (consumersCount * menuMealFoods.length < consumerFoodsCount) {
        await fixExtraConsumerFoods(menu, { clientId, cateringId, menuId, menuMealFoods });
    }

    if (consumersCount * menuMealFoods.length > consumerFoodsCount) {
        await fixMissingConsumerFoods(menu, { clientId, cateringId, menuId, menuMealFoods });
    }




    // consumerFoods = await db.consumerFood.findMany({
    //     where: {
    //         regularMenuId: menuId,
    //         clientId,
    //         cateringId,
    //     },
    // });

    // const consumersWithMenuIds = [...new Set(consumerFoods.map(assignment => assignment.consumerId))];
    // // Check for missing meal assignments for current client
    // const uniqueMealIds = [...new Set(menuMealFoods.map(m => m.mealId))];
    // const existingMealIds = [...new Set(consumerFoods.map(cf => cf.mealId))];
    // const missingMealIds = uniqueMealIds.filter(mealId => !existingMealIds.includes(mealId));
    // if (missingMealIds.length > 0) {
    //     const foods = menuMealFoods.filter(m => missingMealIds.includes(m.mealId)).map(m => ({
    //         id: m.foodId,
    //         mealId: m.mealId,
    //     }));
    //     await db.$transaction(async (tx) => {
    //         await addFoodToConsumers(tx, { cateringId, menu, foods, consumerIds: consumersWithMenuIds });
    //     });
    // }

    // const currentConsumerIds = consumers.map(consumer => consumer.id);
    // const newConsumerIds = currentConsumerIds.filter(id => !consumersWithMenuIds.includes(id));
    // if (newConsumerIds.length > 0) {
    //     const foods = menuMealFoods.map(m => ({
    //         id: m.foodId,
    //         mealId: m.mealId,
    //     }));
    //     await db.$transaction(async (tx) => {
    //         await addFoodToConsumers(tx, { cateringId, menu, foods, consumerIds: newConsumerIds });
    //     });
    // }


}

export default fixConsumerFoods;