import usePagination from '@root/app/hooks/usePagination';
import placeholderData from '@root/app/lib/table/placeholderData';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
import { api } from '@root/app/trpc/react';
import { type TableColumnType } from '@root/types';
import { type ClientWithCommonAllergensSortName, type ClientWithCommonAllergens } from '@root/types/specific';

function useFetchConsumerDiets({
    columns,
    // showColumns,
    searchValue,
    sortName,
    sortDirection,
    tagId,
    consumerAllergenId,
    foodAllergenId,
    foodId,
}: {
    columns: TableColumnType[],
    // showColumns: string[],
    searchValue: string,
    sortName: ClientWithCommonAllergensSortName,
    sortDirection: 'asc' | 'desc',
    tagId?: string,
    consumerAllergenId?: string,
    foodAllergenId?: string,
    foodId?: string,
}) {
    const { day } = useFoodMenuContext();
    const showColumns = columns.map(el => el.key);
    const { data: clientIds, refetch: countRefetch, isFetching: countIsFetching } = api.specific.regularMenu.getClientWithCommonAllergensIds
        .useQuery({ day: day.day ?? { year: 0, month: 0, day: 0 }, sortName, sortDirection, searchValue, tagId, showColumns, consumerAllergenId, foodAllergenId, foodId },
            {
                // enabled: showColumns.length > 0,
            });

    const { page, limit } = usePagination(clientIds?.length ?? 0);

    const { data: fetchedRows = [], refetch: rowsRefetch, isFetching } = api.specific.regularMenu.getClientsWithCommonAllergens
        .useQuery({
            day: day.day ?? { year: 0, month: 0, day: 0 }, page, limit, sortName, sortDirection,
            searchValue, tagId, showColumns, consumerAllergenId, foodAllergenId, foodId, clientIds
        },
            {
                // enabled: clientIds?.length ? true : false,
                placeholderData: placeholderData<ClientWithCommonAllergens>(limit, columns),
            },
        );

    return {
        data: {
            totalCount: clientIds?.length ?? 0,
            fetchedRows,
            isFetching: countIsFetching || isFetching,
            countIsFetching,
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
