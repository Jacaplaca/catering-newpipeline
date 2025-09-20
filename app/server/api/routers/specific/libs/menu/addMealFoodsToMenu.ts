import { type Prisma } from '@prisma/client';

const addMealFoodsToMenu = async (
    tx: Prisma.TransactionClient,
    regularMenuId: string,
    foods: { id: string; mealId: string, order?: number | null }[]
) => {
    const menuMealFoodsData = foods.map(food => ({
        regularMenuId,
        mealId: food.mealId,
        foodId: food.id,
        order: food.order,
    }));

    if (menuMealFoodsData.length > 0) {
        await tx.menuMealFood.createMany({
            data: menuMealFoodsData,
        });
    }
};

export default addMealFoodsToMenu;