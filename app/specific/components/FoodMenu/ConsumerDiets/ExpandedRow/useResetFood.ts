import { api } from '@root/app/trpc/react';
// import { useConsumerDietsTableContext } from '@root/app/specific/components/FoodMenu/ConsumerDiets/context';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';

const useResetFood = () => {
    const { day, rowClick } = useFoodMenuContext();
    const utils = api.useUtils();
    const { mutate, isPending, isSuccess, isError } = api.specific.consumerFood.resetOne.useMutation({
        onSuccess: (updatedAssignment) => {
            // console.log('data', data);
            updatedAssignment && rowClick.updateRawAssignment(updatedAssignment);
            // void utils.specific.consumerFood.getByClientId.invalidate();
            // void utils.specific.regularMenu.getClientsWithCommonAllergens.invalidate();
            void utils.specific.regularMenu.getOneClientWithCommonAllergens.invalidate({
                day: day.day ?? { year: 0, month: 0, day: 0 },
                clientId: rowClick.expandedRowId ?? '',
                showColumns: [],
            });
        },
    });

    return {
        mutate,
        isPending,
        isSuccess,
        isError,
    };
};

export default useResetFood; 