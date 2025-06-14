import usePagination from '@root/app/hooks/usePagination';
import placeholderData from '@root/app/lib/table/placeholderData';
import { api } from '@root/app/trpc/react';
import { type TableColumnType } from '@root/types';
import { type ExclusionSortName, type ExclusionCustomTable } from '@root/types/specific';

function useFetchExclusion({
    columns,
    sortName,
    sortDirection,
    filter,
}: {
    columns: TableColumnType[],
    sortName: ExclusionSortName,
    sortDirection: 'asc' | 'desc',
    filter: { allergens: { id: string, name: string }[], searchValue: string },
}) {
    const allergens = filter?.allergens.map(allergen => allergen.id);
    const searchValue = filter?.searchValue;

    const { data: totalCount = 0, refetch: countRefetch, isFetching: countIsFetching }
        = api.specific.exclusion.count.useQuery({ allergens, searchValue }, {
            enabled: true,
        });

    const { page, limit } = usePagination(totalCount);

    const { data: fetchedRows = [], refetch: rowsRefetch, isFetching }
        = api.specific.exclusion.getMany
            .useQuery({ page, limit, sortName, sortDirection, allergens, searchValue },
                {
                    enabled: true,
                    placeholderData: placeholderData<ExclusionCustomTable>(limit, columns),
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

export default useFetchExclusion;    
