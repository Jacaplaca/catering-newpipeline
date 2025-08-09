import { api } from '@root/app/trpc/react';

const useFoodOrder = () => {
    const utils = api.useUtils();

    const { mutate: updateFoodsOrder } = api.specific.regularMenu.updateFoodsOrder.useMutation({
        onSuccess: () => {
            void utils.specific.regularMenu.getOne.invalidate();
        },
    });

    const updateFoodsOrderMutation = (items: { id: string, order: number }[]) => {
        updateFoodsOrder({ items });
    };



    return { updateFoodsOrderMutation };
};

export default useFoodOrder; 