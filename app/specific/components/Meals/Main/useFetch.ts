import usePagination from '@root/app/hooks/usePagination';
import placeholderData from '@root/app/lib/table/placeholderData';
import { api } from '@root/app/trpc/react';
import { type TableColumnType } from '@root/types';
import { type MealCustomTable, type MealSortName } from '@root/types/specific';

function useFetchMeals({
    columns,
    sortName,
    sortDirection,
}: {
    columns: TableColumnType[],
    sortName: MealSortName,
    sortDirection: 'asc' | 'desc',
}) {
    const { data: totalCount = 0, refetch: countRefetch, isFetching: countIsFetching }
        = api.specific.meal.count.useQuery({}, {
            enabled: true,
        });

    const { page, limit } = usePagination(totalCount);

    const { data: fetchedRows = [], refetch: rowsRefetch, isFetching }
        = api.specific.meal.getMany
            .useQuery({ page, limit, sortName, sortDirection },
                {
                    enabled: true,
                    placeholderData: placeholderData<MealCustomTable>(limit, columns),
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

export default useFetchMeals;
