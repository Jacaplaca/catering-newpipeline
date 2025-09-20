import { api } from '@root/app/trpc/react';
// import { useConsumerDietsTableContext } from '@root/app/specific/components/FoodMenu/ConsumerDiets/context';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';

const useResetMeal = () => {
    const { day, rowClick, menuQueries } = useFoodMenuContext();
    const utils = api.useUtils();
    const { mutate, isPending, isSuccess, isError } = api.specific.consumerFood.resetMeal.useMutation({
        onSuccess: () => {
            void menuQueries.currentClient.refetch();
            void utils.specific.consumerFood.getByClientId.invalidate({
                clientId: rowClick.expandedRowId ?? '',
                day: day.day ?? { year: 0, month: 0, day: 0 },
            });
            void utils.specific.regularMenu.getClientsWithCommonAllergens.invalidate();
        },
    });

    const resetMealGroup = (mealId: string) => {
        mutate({
            parentRegularMenuId: menuQueries?.existingMenu?.id ?? '',
            mealId,
            clientId: rowClick.expandedRowId ?? '',
        });
    };

    return {
        resetMealGroup,
        isPending,
        isSuccess,
        isError,
    };
};

export default useResetMeal; 