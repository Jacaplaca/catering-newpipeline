import { type UpdateMessageType } from '@root/app/hooks/useMessage';
import useClientFoods from '@root/app/specific/components/FoodMenu/ConsumerDiets/ExpandedRow/useClienFoodsFetch';
import { api } from '@root/app/trpc/react';
import { type ClientFoodAssignment } from '@root/types/specific';
import { useEffect, useState } from 'react';


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
    const [rawAssignments, setRawAssignments] = useState<ClientFoodAssignment[]>([]);

    const updateRawAssignment = (assignment: ClientFoodAssignment) => {
        setRawAssignments(prev => prev.map(a => a.id === assignment.id ? assignment : a));
    }


    const { data: clientConsumers, isLoading: clientConsumersLoading } = api.specific.consumer.dietaryAll.useQuery({ clientId: expandedRowId ?? '' }, { enabled: !!expandedRowId });
    const clientFoods = useClientFoods(day, expandedRowId ?? '');

    useEffect(() => {
        if (clientFoods.data) {
            setRawAssignments(clientFoods.data.rawAssignments);
        }
    }, [clientFoods.data]);


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
        clientFoods: {
            data: {
                ...clientFoods.data,
                rawAssignments,
                menuMealFoods: clientFoods.data?.menuMealFoods ?? []
            },
            isFetching: clientFoods.isFetching
        },
        updateMessage,
        resetMessage,
        updateRawAssignment,
    };
};

export default useConsumerDietsRow;