import { zodResolver } from '@hookform/resolvers/zod';
import { type UpdateMessageType } from '@root/app/hooks/useMessage';
import translate from '@root/app/lib/lang/translate';
import useClientFoods from '@root/app/specific/components/FoodMenu/ConsumerDiets/ExpandedRow/useClienFoodsFetch';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
// import useTags from '@root/app/specific/components/Clients/ExpandedRow/useTags';
import { api } from '@root/app/trpc/react';
import { clientEditValidator } from '@root/app/validators/specific/client';
import { consumerFoodValidator } from '@root/app/validators/specific/consumerFood';
import { type ClientCustomTable } from '@root/types/specific';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';


const useConsumerDietsRow = ({
    setRows,
    dictionary,
    updateMessage,
    resetMessage
}: {
    setRows: Dispatch<SetStateAction<ClientCustomTable[]>>,
    dictionary: Record<string, string>,
    updateMessage: UpdateMessageType,
    resetMessage: () => void
}) => {
    // const utils = api.useUtils();
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const { day: { day } } = useFoodMenuContext();

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