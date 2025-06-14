import usePagination from '@root/app/hooks/usePagination';
import placeholderData from '@root/app/lib/table/placeholderData';
import { api } from '@root/app/trpc/react';
import { type TableColumnType } from '@root/types';
import { type ClientCustomTable, type ClientsSortName } from '@root/types/specific';

function useFetchConsumerDiets({
    columns,
    // showColumns,
    searchValue,
    sortName,
    sortDirection,
    tagId
}: {
    columns: TableColumnType[],
    // showColumns: string[],
    searchValue: string,
    sortName: ClientsSortName,
    sortDirection: 'asc' | 'desc',
    tagId?: string,
}) {
    const showColumns = columns.map(el => el.key);
    const { data: totalCount = 0, refetch: countRefetch, isFetching: countIsFetching } = api.specific.client.count
        .useQuery({ searchValue, tagId, showColumns }, {
            // enabled: showColumns.length > 0,
        });

    const { page, limit } = usePagination(totalCount);

    const { data: fetchedRows = [], refetch: rowsRefetch, isFetching } = api.specific.client.getMany
        .useQuery({ page, limit, sortName, sortDirection, searchValue, tagId, showColumns },
            {
                // enabled: showColumns.length > 0,
                placeholderData: placeholderData<ClientCustomTable>(limit, columns),
            },
        );

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
        }
    }
}

export default useFetchConsumerDiets;
