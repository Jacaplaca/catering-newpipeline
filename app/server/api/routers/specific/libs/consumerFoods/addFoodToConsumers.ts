import { type RegularMenu, type Prisma } from '@prisma/client';
import assignConsumerFoods from '@root/app/server/api/routers/specific/libs/consumerFoods/assignConsumerFoods';
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

const addFoodToConsumers = async (
    tx: Prisma.TransactionClient,
    { cateringId, menu, foods, update, consumerIds }: { cateringId: string, menu: RegularMenu, foods: { id: string; mealId: string }[], update?: boolean, consumerIds?: string[] }
) => {
    const consumers = await getConsumers(tx, { cateringId, clientId: menu.clientId, update, consumerIds, day: menu.day });

    if (consumers.length === 0) return;

    if (menu.clientId) {
        const { day } = menu;
        const generalMenu = await getOriginalMenu(tx, cateringId, day);
        if (generalMenu) {
            await assignConsumerFoods(tx, { menu, foods, consumers, cateringId });
            await removeConsumerFoods(tx, generalMenu.id, consumers);
        } else {
            // No original menu exists, create new assignments normally
            await assignConsumerFoods(tx, { menu, foods, consumers, cateringId });
        }
    } else {
        // This is a general menu (not client-specific), create assignments normally
        await assignConsumerFoods(tx, { menu, foods, consumers, cateringId });
    }
};

export default addFoodToConsumers;