import { type MealGroup } from '@prisma/client';
import { type GroupedByConsumer } from '@root/app/server/api/routers/specific/libs/consumerFoods/dayMenuPdf/groupDataByConsumer';
import { type MealsInConsumerByIdMap, type TransformedClientWithConsumersData, type TransformedConsumerData, type TransformedRouteWithConsumersData } from '@root/app/server/api/routers/specific/libs/getGroupedConsumerFoodDataObject';

export interface CleanedMealGroup {
    mealGroup: MealGroup;
    meals: MealsInConsumerByIdMap;
}

export type CleanedDailyMenu = Record<string, CleanedMealGroup>;

export type CleanedWeeklyMenu = Record<string, CleanedDailyMenu>;

function transformMenuForConsumer(rawData: GroupedByConsumer[]): CleanedWeeklyMenu | null {
    if (!rawData || rawData.length === 0) {
        return null;
    }

    const menuData = rawData[0]?.data;
    if (!menuData) {
        return null;
    }

    const cleanedMenu: CleanedWeeklyMenu = {};

    for (const date in menuData) {
        if (Object.prototype.hasOwnProperty.call(menuData, date)) {
            cleanedMenu[date] = {};
            const dailyRawData = menuData[date];

            for (const mealGroupName in dailyRawData) {
                if (Object.prototype.hasOwnProperty.call(dailyRawData, mealGroupName)) {
                    const mealGroupRawData = dailyRawData[mealGroupName];

                    const route = Object.values(mealGroupRawData!.routes)[0] as TransformedRouteWithConsumersData | undefined;
                    if (!route) continue;

                    const client = Object.values(route.clients)[0] as TransformedClientWithConsumersData | undefined;
                    if (!client) continue;

                    const consumerDetails = Object.values(client.consumers)[0] as TransformedConsumerData | undefined;
                    if (!consumerDetails) continue;

                    cleanedMenu[date][mealGroupName] = {
                        mealGroup: mealGroupRawData!.mealGroup,
                        meals: consumerDetails.meals
                    };
                }
            }
        }
    }

    return cleanedMenu;
}

export default transformMenuForConsumer;