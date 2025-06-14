import { type FoodCategory } from '@prisma/client';
import usePagination from '@root/app/hooks/usePagination';
import placeholderData from '@root/app/lib/table/placeholderData';
import { api } from '@root/app/trpc/react';
import { type TableColumnType } from '@root/types';
import { type FoodCategorySortName } from '@root/types/specific';

function useFetchFoodCategory({
    columns,
    sortName,
    sortDirection,
}: {
    columns: TableColumnType[],
    sortName: FoodCategorySortName,
    sortDirection: 'asc' | 'desc',
}) {
    const { data: totalCount = 0, refetch: countRefetch, isFetching: countIsFetching }
        = api.specific.foodCategory.count.useQuery({}, {
            enabled: true,
        });

    const { page, limit } = usePagination(totalCount);

    const { data: fetchedRows = [], refetch: rowsRefetch, isFetching }
        = api.specific.foodCategory.getMany
            .useQuery({ page, limit, sortName, sortDirection },
                {
                    enabled: true,
                    placeholderData: placeholderData<FoodCategory>(limit, columns),
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

export default useFetchFoodCategory;
