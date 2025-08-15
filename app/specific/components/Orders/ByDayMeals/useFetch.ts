import usePagination from '@root/app/hooks/usePagination';
import placeholderData from '@root/app/lib/table/placeholderData';
import { api } from '@root/app/trpc/react';
import { type TableColumnType } from '@root/types';
import { type OrderGroupedByDayCustomTable } from '@root/types/specific';

function useFetchOrdersByDay({
    columns,
    sortDirection,
}: {
    columns: TableColumnType[],
    sortDirection: 'asc' | 'desc',
}) {
    const { data: totalCount = 0, refetch: countRefetch, isFetching: countIsFetching }
        = api.specific.order.groupedByDay.count.useQuery(undefined, {
            enabled: true,
        });

    const { page, limit } = usePagination(totalCount);

    const { data: fetchedRows = [], refetch: rowsRefetch, isFetching }
        = api.specific.order.groupedByDay.table.useQuery({ page, limit, sortDirection },
            {
                enabled: true,
                placeholderData: placeholderData<OrderGroupedByDayCustomTable>(limit, columns),
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

export default useFetchOrdersByDay;
