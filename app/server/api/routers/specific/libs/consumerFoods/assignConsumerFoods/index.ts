import { type RegularMenu, type Prisma } from '@prisma/client';
import getConsumerFoods from '@root/app/server/api/routers/specific/libs/consumerFoods/assignConsumerFoods/getConsumerFoods';
import getExclusionsAndConsumerFoodsToCreate from '@root/app/server/api/routers/specific/libs/consumerFoods/assignConsumerFoods/getExlusionsAndConsumerFoodsToCreate';
import saveExclusions from '@root/app/server/api/routers/specific/libs/consumerFoods/assignConsumerFoods/saveExclusions';

const assignConsumerFoods = async (
    tx: Prisma.TransactionClient, {
        menu,
        foods,
        consumers,
        cateringId
    }: {
        menu: RegularMenu,
        foods: { id: string; mealId: string }[],
        consumers: { id: string, clientId: string }[],
        cateringId: string
    }
) => {

    const consumerIds = consumers.map(c => c.id);
    const foodIds = foods.map(f => f.id);

    const exampleConsumerFoods = await getConsumerFoods(tx, { consumerIds, foodIds });

    const { exclusionsMap, consumerFoodsToCreate } = getExclusionsAndConsumerFoodsToCreate({
        foods,
        consumers,
        regularMenuId: menu.id,
        cateringId,
        exampleConsumerFoods
    });

    if (consumerFoodsToCreate.length > 0) {
        await tx.consumerFood.createMany({
            data: consumerFoodsToCreate,
        });
    }

    await saveExclusions(tx, { exclusionsMap, foods, regularMenuId: menu.id, consumerIds, foodIds });

    return exampleConsumerFoods;

}

export default assignConsumerFoods;