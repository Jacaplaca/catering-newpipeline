// Group meals by mealGroup to create parent columns with children

import { type MealCustomTable } from "@root/types/specific";

export type MealGroupsMap = Map<string, { id: string; name: string; order: number; meals: MealCustomTable[] }>;

export const groupMeals = (meals: MealCustomTable[]): {
    groupsMap: MealGroupsMap,
    ungroupedMeals: MealCustomTable[]
} => {

    const groupsMap = new Map<string, { id: string; name: string; order: number; meals: MealCustomTable[] }>();
    const ungroupedMeals: MealCustomTable[] = [];

    meals.forEach((meal) => {
        const groupId = meal.mealGroup?.id ?? meal.mealGroupId;
        if (!groupId) {
            ungroupedMeals.push(meal);
            return;
        }
        const existing = groupsMap.get(groupId);
        if (existing) {
            existing.meals.push(meal);
            return;
        }
        groupsMap.set(groupId, {
            id: groupId,
            name: meal.mealGroup?.name ?? groupId,
            order: meal.mealGroup?.order ?? Number.MAX_SAFE_INTEGER,
            meals: [meal]
        });
    });

    return { groupsMap, ungroupedMeals };
}

export default groupMeals;
