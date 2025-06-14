import { api } from '@root/app/trpc/react';

const useResetFood = () => {
    const utils = api.useUtils();
    const { mutate, isPending, isSuccess, isError } = api.specific.consumerFood.resetOne.useMutation({
        onSuccess: () => {
            void utils.specific.consumerFood.getByClientId.invalidate();
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