import usePagination from '@root/app/hooks/usePagination';
import placeholderData from '@root/app/lib/table/placeholderData';
import { api } from '@root/app/trpc/react';
import { type TableColumnType } from '@root/types';
import { type FoodCustomTable, type FoodSortName } from '@root/types/specific';

function useFetchFood({
    columns,
    sortName,
    sortDirection,
    filter,
}: {
    columns: TableColumnType[],
    sortName: FoodSortName,
    sortDirection: 'asc' | 'desc',
    filter: { foodCategory: { id: string, name: string } | null, allergens: { id: string, name: string }[], searchValue: string },
}) {
    const foodCategory = filter?.foodCategory?.id;
    const allergens = filter?.allergens.map(allergen => allergen.id);
    const searchValue = filter?.searchValue;

    const { data: totalCount = 0, refetch: countRefetch, isFetching: countIsFetching }
        = api.specific.food.count.useQuery({ foodCategory, allergens, searchValue }, {
            enabled: true,
        });

    const { page, limit } = usePagination(totalCount);

    const { data: fetchedRows = [], refetch: rowsRefetch, isFetching }
        = api.specific.food.getMany
            .useQuery({ page, limit, sortName, sortDirection, foodCategory, allergens, searchValue },
                {
                    enabled: true,
                    placeholderData: placeholderData<FoodCustomTable>(limit, columns),
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

export default useFetchFood;
