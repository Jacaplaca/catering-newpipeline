import { type MealGroup } from '@prisma/client';
import { type RoutesWithConsumersByIdMap } from '@root/app/server/api/routers/specific/libs/getGroupedConsumerFoodDataObject';
import getGroupedFoodData from '@root/app/server/api/routers/specific/libs/pdf/getGroupedFoodData';
import { db } from '@root/app/server/db';

export type GetDayFoodDataResult = Record<string, Record<string, {
    mealGroup: MealGroup,
    routes: RoutesWithConsumersByIdMap
}>>;

const getDayFoodData = async ({
    dayIds,
    cateringId,
    ignoreOrders = false,
    clientId,
    allowEmpty = false
}: {
    dayIds: string[];
    cateringId: string,
    ignoreOrders?: boolean,
    clientId?: string,
    allowEmpty?: boolean,
    allowEmptyMealGroups?: boolean
}) => {
    const mealGroups = await db.mealGroup.findMany();
    const result: GetDayFoodDataResult = {};

    for (const dayId of dayIds) {
        const meal2data: Record<string, { mealGroup: MealGroup, routes: RoutesWithConsumersByIdMap, consumersWithoutChangesCount: number, changesCount: number }> = {};
        let hasMealData = false;

        for (const mealGroup of mealGroups) {
            const { consumerFoodByRoute } = await getGroupedFoodData({ dayId, mealGroupIdProp: mealGroup.id, cateringId, groupBy: 'byConsumer', ignoreOrders, clientId });

            // Check if mealGroup has data or if we should include empty ones
            const hasData = Object.keys(consumerFoodByRoute).length > 0;
            if (hasData || allowEmpty) {
                meal2data[mealGroup.id] = {
                    mealGroup,
                    routes: consumerFoodByRoute,
                    consumersWithoutChangesCount: Object.values(consumerFoodByRoute).reduce((acc, route) => acc + route.consumersWithoutChangesCount, 0),
                    changesCount: Object.values(consumerFoodByRoute).reduce((acc, route) => acc + route.changesCount, 0)
                };
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