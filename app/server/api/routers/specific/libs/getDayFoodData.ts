import { type RoutesWithConsumersByIdMap } from '@root/app/server/api/routers/specific/libs/getGroupedConsumerFoodDataObject';
import getGroupedFoodData from '@root/app/server/api/routers/specific/libs/pdf/getGroupedFoodData';
import { db } from '@root/app/server/db';

const getDayFoodData = async ({ dayId, cateringId }: { dayId: string; cateringId: string }) => {
    const mealGroups = await db.mealGroup.findMany();
    const meal2data: Record<string, RoutesWithConsumersByIdMap> = {};
    for (const mealGroup of mealGroups) {
        const { consumerFoodByRoute } = await getGroupedFoodData({ dayId, mealGroupIdProp: mealGroup.id, cateringId, groupBy: 'byConsumer' });
        meal2data[mealGroup.name ?? mealGroup.id] = consumerFoodByRoute;
    }
    return meal2data;
}

export default getDayFoodData;