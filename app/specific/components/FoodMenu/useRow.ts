import { type UpdateMessageType } from '@root/app/hooks/useMessage';
import useClientFoods from '@root/app/specific/components/FoodMenu/ConsumerDiets/ExpandedRow/useClienFoodsFetch';
import { api } from '@root/app/trpc/react';
import { useState } from 'react';


const useConsumerDietsRow = ({
    updateMessage,
    resetMessage,
    day
}: {
    updateMessage: UpdateMessageType,
    resetMessage: () => void,
    day: { year: number, month: number, day: number } | null
}) => {
    // const utils = api.useUtils();
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);


    const { data: clientConsumers, isLoading: clientConsumersLoading } = api.specific.consumer.dietaryAll.useQuery({ clientId: expandedRowId ?? '' }, { enabled: !!expandedRowId });
    const clientFoods = useClientFoods(day, expandedRowId ?? '');

    const { data: client, isFetching: fullClientFetching } = api.specific.client.getOne.useQuery(
        { id: expandedRowId ?? '' },
        { enabled: true }
    );

    const onRowClick = (key: string | null) => {
        setExpandedRowId(state => state === key ? null : key);
    };




    return {
        onRowClick,
        expandedRowId,
        client,
        clientConsumers,
        clientConsumersLoading,
        fullClientFetching,
        clientFoods,
        updateMessage,
        resetMessage,
    };
};

export default useConsumerDietsRow;