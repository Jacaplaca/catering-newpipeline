import { type Prisma } from '@prisma/client';
import addFoodToConsumers from '@root/app/server/api/routers/specific/libs/consumerFoods/addFoodToConsumers';
import addMealFoodsToMenu from '@root/app/server/api/routers/specific/libs/menu/addMealFoodsToMenu';
import { db } from '@root/app/server/db';

const removeMealFoodsFromMenu = async (tx: Prisma.TransactionClient, mealFoodsIds: string[]) => {
    await tx.menuMealFood.deleteMany({
        where: {
            id: { in: mealFoodsIds },
        },
    });
}

const removeConsumerFoods = async (
    tx: Prisma.TransactionClient,
    individualMenuId: string,
    toDelete: Array<{ mealId: string; foodId: string }>
) => {
    // Delete consumerFoods directly using OR conditions for each mealId+foodId combination
    const deleteResult = await tx.consumerFood.deleteMany({
        where: {
            regularMenuId: individualMenuId,
            OR: toDelete.map(item => ({
                AND: [
                    { mealId: item.mealId },
                    { foodId: item.foodId }
                ]
            }))
        }
    });

    console.log(`Deleted ${deleteResult.count} consumerFoods`);

    return deleteResult;
}

const resetMealGroupInIndividualMenu = async ({
    parentRegularMenuId,
    mealId,
    clientId,
    cateringId,
}: {
    parentRegularMenuId: string;
    mealId: string;
    clientId: string;
    cateringId: string;
}) => {
    const parentRegularMenu = await db.regularMenu.findFirst({
        where: {
            id: parentRegularMenuId,
        },
    });
    if (!parentRegularMenu) {
        throw new Error('Parent regular menu not found');
    }

    const individualMenu = await db.regularMenu.findFirst({
        where: {
            day: parentRegularMenu.day,
            clientId,
        },
    });

    if (!individualMenu) {
        throw new Error('Individual menu not found');
    }

    const indMenuMealFoodsPromise = db.menuMealFood.findMany({
        where: {
            regularMenuId: individualMenu.id,
            mealId
        },
    });

    const parentMenuMealFoodsPromise = db.menuMealFood.findMany({
        where: {
            regularMenuId: parentRegularMenu.id,
            mealId
        },
    });

    const [indMenuMealFoods, parentMenuMealFoods] = await Promise.all([indMenuMealFoodsPromise, parentMenuMealFoodsPromise]);

    // Create sets of mealId+foodId combinations for comparison
    const parentCombinations = new Set(
        parentMenuMealFoods.map(item => `${item.mealId}_${item.foodId}`)
    );

    const indCombinations = new Set(
        indMenuMealFoods.map(item => `${item.mealId}_${item.foodId}`)
    );

    // Items in individual menu that are not in parent menu
    const uniqueToIndividual = indMenuMealFoods.filter(item =>
        !parentCombinations.has(`${item.mealId}_${item.foodId}`)
    );

    // Items in parent menu that are not in individual menu
    const uniqueToParent = parentMenuMealFoods.filter(item =>
        !indCombinations.has(`${item.mealId}_${item.foodId}`)
    );

    // Operations needed to sync individual menu with parent menu
    const toDelete = uniqueToIndividual; // Items to remove from individual menu
    const toAdd = uniqueToParent; // Items to add to individual menu from parent

    // console.log('Items to DELETE from individual menu:', toDelete);
    // console.log('Items to ADD to individual menu from parent:', toAdd);

    return db.$transaction(async (tx) => {
        const toAddFoods = toAdd.map(item => ({ id: item.foodId, mealId: item.mealId, order: item.order }));
        const toDeleteIds = toDelete.map(item => item.id);
        await removeMealFoodsFromMenu(tx, toDeleteIds);
        await removeConsumerFoods(tx, individualMenu.id, toDelete);
        await addMealFoodsToMenu(tx, individualMenu.id, toAddFoods);
        await addFoodToConsumers(tx, { cateringId, menu: individualMenu, foods: toAddFoods });
    });

    // return {
    //     uniqueToIndividual,
    //     uniqueToParent,
    //     toDelete,
    //     toAdd
    // };

}

export default resetMealGroupInIndividualMenu;