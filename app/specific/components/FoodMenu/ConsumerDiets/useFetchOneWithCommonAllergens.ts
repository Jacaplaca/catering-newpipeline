import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
import { api } from '@root/app/trpc/react';
import { type TableColumnType } from '@root/types';
import { type ClientWithCommonAllergens } from '@root/types/specific';
import { useState, useCallback, useEffect } from 'react';

function useFetchOneWithCommonAllergens({
    columns,
    clientId,
    updateRow,
}: {
    columns: TableColumnType[],
    clientId: string | null,
    updateRow: (row: ClientWithCommonAllergens) => void,
}) {
    const { day } = useFoodMenuContext();
    const showColumns = columns.map(el => el.key);
    // const [clientId, setClientId] = useState<string | null>(null);

    const { data: fetchedClient, refetch: rowsRefetch, isFetching } = api.specific.regularMenu.getOneClientWithCommonAllergens
        .useQuery(
            {
                day: day.day ?? { year: 0, month: 0, day: 0 },
                clientId: clientId ?? '',
                showColumns,
            },
            {
                enabled: !!clientId, // Only fetch when clientId is provided
                // placeholderData: placeholderData<ClientWithCommonAllergens>(limit, columns),
            },
        );

    useEffect(() => {
        // console.log('fetchedClient', fetchedClient);
        if (fetchedClient) {
            // console.log('fetchedClient', fetchedClient);
            updateRow(fetchedClient);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchedClient]);

    // // Method 1: Update state (current implementation)
    // const fetchForClient = useCallback((newClientId: string) => {
    //     setClientId(newClientId);
    // }, []);

    // // Method 2: Manual refetch with new clientId (alternative approach)
    // const fetchForClientManual = useCallback(async (newClientId: string) => {
    //     setClientId(newClientId);
    //     // The query will automatically refetch due to dependency change
    //     // Or you can manually call refetch if needed
    //     if (newClientId) {
    //         await rowsRefetch();
    //     }
    // }, [rowsRefetch]);

    // const clearClient = useCallback(() => {
    //     setClientId(null);
    // }, []);

    return {
        data: {
            fetchedRows: fetchedClient,
            isFetching,
        },
        refetch: {
            rowsRefetch,
        },
        // actions: {
        //     fetchForClient,
        //     fetchForClientManual, // Alternative method
        //     clearClient,
        // },
        currentClientId: clientId,
    }
}

export default useFetchOneWithCommonAllergens;
