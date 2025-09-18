import { type RoutesWithConsumersByIdMap } from '@root/app/server/api/routers/specific/libs/getGroupedConsumerFoodDataObject';
import getGroupedFoodData from '@root/app/server/api/routers/specific/libs/pdf/getGroupedFoodData';
import { db } from '@root/app/server/db';

const getDayFoodData = async ({ dayIds, cateringId, ignoreOrders = false, clientId, allowEmpty = false }: { dayIds: string[]; cateringId: string, ignoreOrders?: boolean, clientId?: string, allowEmpty?: boolean, allowEmptyMealGroups?: boolean }) => {
    const mealGroups = await db.mealGroup.findMany();
    const result: Record<string, Record<string, RoutesWithConsumersByIdMap>> = {};

    for (const dayId of dayIds) {
        const meal2data: Record<string, RoutesWithConsumersByIdMap> = {};
        let hasMealData = false;

        for (const mealGroup of mealGroups) {
            const { consumerFoodByRoute } = await getGroupedFoodData({ dayId, mealGroupIdProp: mealGroup.id, cateringId, groupBy: 'byConsumer', ignoreOrders, clientId });

            // Check if mealGroup has data or if we should include empty ones
            const hasData = Object.keys(consumerFoodByRoute).length > 0;
            if (hasData || allowEmpty) {
                meal2data[mealGroup.name ?? mealGroup.id] = consumerFoodByRoute;
                if (hasData) {
                    hasMealData = true;
                }
            }
        }

        // Check if dayId has data or if we should include empty ones
        if (hasMealData || allowEmpty) {
            result[dayId] = meal2data;
        }
    }
    return result;
}

export default getDayFoodData;