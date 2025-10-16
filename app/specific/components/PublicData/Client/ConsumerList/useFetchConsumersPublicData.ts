import { api } from '@root/app/trpc/react';
import getPagination from '@root/app/lib/getPagination';
import { useEffect, useState } from 'react';

function useFetchConsumersPublicData({
    clientId,
}: {
    clientId?: string,
}) {
    const { data: totalCount = 0, refetch: countRefetch, isFetching: countIsFetching }
        = api.specific.consumer.countPublic.useQuery({ clientId }, {
            enabled: !!clientId,
        });

    const [pageState, setPageState] = useState(1);
    const [limitState, setLimitState] = useState(10);

    useEffect(() => {
        // console.log('useEffect', clientId);
        setPageState(1);
        setLimitState(10);
    }, [clientId]);

    const updatePage = (page: number) => {
        // console.log('updatePage', page);
        setPageState(page);
    }

    const updateLimit = (limit: number) => {
        // console.log('updateLimit', limit);
        setLimitState(limit);
    }

    // Tworzymy URLSearchParams z aktualnych wartości state
    const fakeSearchParams = new URLSearchParams();
    fakeSearchParams.set('page', pageState.toString());
    fakeSearchParams.set('limit', limitState.toString());

    const { page, limit } = getPagination(fakeSearchParams, totalCount ?? 0);

    const { data: fetchedRows = [], refetch: rowsRefetch, isFetching }
        = api.specific.consumer.getManyPublic
            .useQuery({ clientId, page, limit });

    return {
        data: {
            totalCount,
            fetchedRows,
            isFetching: countIsFetching || isFetching,
        },
        refetch: {
            countRefetch,
            rowsRefetch,
        },
        pagination: {
            page,
            limit,
            updatePage,
            updateLimit,
        }
    }
}

export default useFetchConsumersPublicData;
