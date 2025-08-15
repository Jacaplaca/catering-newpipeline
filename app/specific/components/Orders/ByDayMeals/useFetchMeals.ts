import { groupMeals } from '@root/app/specific/components/Orders/ByDayMeals/groupMeals';
import { api } from "@root/app/trpc/react";

function useFetchMeals() {
    const { data: meals = [], refetch: mealsRefetch, isFetching }
        = api.specific.meal.getAll.useQuery(undefined,
            {
                enabled: true,
            },
        );

    const { groupsMap } = groupMeals(meals);

    return {
        meals,
        groupedMeals: groupsMap,
        mealsRefetch,
        isFetching,
    }
}

export default useFetchMeals;