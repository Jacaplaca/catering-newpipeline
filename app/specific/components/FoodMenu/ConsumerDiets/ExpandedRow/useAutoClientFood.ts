import translate from '@root/app/lib/lang/translate';
import { useConsumerDietsTableContext } from '@root/app/specific/components/FoodMenu/ConsumerDiets/context';
import { api } from '@root/app/trpc/react';

const useAutoClientFood = () => {
    const utils = api.useUtils();
    const { dictionary, rowClick } = useConsumerDietsTableContext();
    const { mutate, isPending, isSuccess, isError } = api.specific.consumerFood.autoReplace.useMutation({
        onSuccess: (data) => {
            // console.log(data);
            if (data) {
                void utils.specific.consumerFood.getByClientId.invalidate();
                void utils.specific.regularMenu.getClientsWithCommonAllergens.invalidate();
            }
        },
        onError: (error) => {
            rowClick.updateMessage({
                content: translate(dictionary, error.message),
                status: 'error',
                timeout: 4000,
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

export default useAutoClientFood; 