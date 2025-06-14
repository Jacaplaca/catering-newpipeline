import { type Allergen } from '@prisma/client';
import usePagination from '@root/app/hooks/usePagination';
import placeholderData from '@root/app/lib/table/placeholderData';
import { api } from '@root/app/trpc/react';
import { type TableColumnType } from '@root/types';
import { type AllergenSortName } from '@root/types/specific';

function useFetchAllergens({
    columns,
    sortName,
    sortDirection,
}: {
    columns: TableColumnType[],
    sortName: AllergenSortName,
    sortDirection: 'asc' | 'desc',
}) {
    const { data: totalCount = 0, refetch: countRefetch, isFetching: countIsFetching }
        = api.specific.allergen.count.useQuery({}, {
            enabled: true,
        });

    const { page, limit } = usePagination(totalCount);

    const { data: fetchedRows = [], refetch: rowsRefetch, isFetching }
        = api.specific.allergen.getMany
            .useQuery({ page, limit, sortName, sortDirection },
                {
                    enabled: true,
                    placeholderData: placeholderData<Allergen>(limit, columns),
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

export default useFetchAllergens;
