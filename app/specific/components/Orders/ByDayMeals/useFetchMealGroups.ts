import { api } from "@root/app/trpc/react";

function useFetchMealGroups() {
    const { data: mealGroups = [], refetch: mealGroupsRefetch, isFetching }
        = api.specific.mealGroup.getAll.useQuery(undefined,
            {
                enabled: true,
            },
        );

    return {
        mealGroups,
        mealGroupsRefetch,
        isFetching,
    }
}

export default useFetchMealGroups;