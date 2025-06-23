import useRows from '@root/app/hooks/table/useRows';
import useTableSort from '@root/app/hooks/table/useTableSort';
import useSearch from '@root/app/hooks/useSearch';
import useConsumerDietsColumns from '@root/app/specific/components/FoodMenu/ConsumerDiets/useColumns';
import useConsumerDietsDataGrid from '@root/app/specific/components/FoodMenu/ConsumerDiets/useDataGrid';
import useFetchConsumerDiets from '@root/app/specific/components/FoodMenu/ConsumerDiets/useFetch';
import useFilter from '@root/app/specific/components/FoodMenu/ConsumerDiets/useFilter';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
import { type SettingParsedType } from '@root/types';
import { type ClientWithCommonAllergens, type ClientWithCommonAllergensSortName } from '@root/types/specific';
import { useEffect } from 'react';

const useConsumerDietsTable = ({
    lang,
    pageName,
    settings,
    dictionary,
}: {
    lang: LocaleApp,
    pageName: string,
    settings: { main: SettingParsedType },
    dictionary: Record<string, string>,
}) => {

    const { sort, sortDirection, sortName } = useTableSort<ClientWithCommonAllergensSortName>("info.name")
    const { searchValue, search } = useSearch({ lang, pageName });
    const filter = useFilter({ lang, pageName });

    const columns = useConsumerDietsColumns({ sort });
    const { rowClick } = useFoodMenuContext();

    const {
        data: {
            totalCount,
            fetchedRows,
            isFetching
        },
        refetch: {
            countRefetch,
            rowsRefetch,
        },
        pagination: {
            page,
            limit
        },
    } = useFetchConsumerDiets({
        tagId: filter.tags.tagId,
        columns,
        searchValue,
        sortName,
        sortDirection,
    });

    const [rows] = useRows<ClientWithCommonAllergens>(fetchedRows);


    useEffect(() => {
        rowClick.onRowClick(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit, searchValue]);


    const { skeleton, table } = useConsumerDietsDataGrid({
        dictionary,
        rows,
        searchValue,
        limit,
        totalCount,
        columns,
    })

    async function resetTable() {
        await countRefetch();
        await rowsRefetch();
    }



    return {
        pageName,
        lang,
        dictionary,
        settings,
        data: { table, skeleton },
        columns,
        isFetching,
        totalCount,
        search,
        sort: { sortName, sortDirection },
        filter,
        resetTable,
        rowClick
    }
};
export default useConsumerDietsTable;