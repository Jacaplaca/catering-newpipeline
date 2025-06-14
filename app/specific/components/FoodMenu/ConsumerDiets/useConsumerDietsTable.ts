import useRows from '@root/app/hooks/table/useRows';
import useTableSort from '@root/app/hooks/table/useTableSort';
import useMessage from '@root/app/hooks/useMessage';
import useSearch from '@root/app/hooks/useSearch';
import useConsumerDietsColumns from '@root/app/specific/components/FoodMenu/ConsumerDiets/useColumns';
import useConsumerDietsDataGrid from '@root/app/specific/components/FoodMenu/ConsumerDiets/useDataGrid';
import useFetchConsumerDiets from '@root/app/specific/components/FoodMenu/ConsumerDiets/useFetch';
import useFilter from '@root/app/specific/components/FoodMenu/ConsumerDiets/useFilter';
import useConsumerDietsRow from '@root/app/specific/components/FoodMenu/ConsumerDiets/useRow';
import { type SettingParsedType } from '@root/types';
import { type ClientCustomTable, type ClientsSortName } from '@root/types/specific';
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
    const { messageObj, resetMessage, updateMessage } = useMessage(dictionary);
    const { sort, sortDirection, sortName } = useTableSort<ClientsSortName>("name")
    const { searchValue, search } = useSearch({ lang, pageName });
    const filter = useFilter({ lang, pageName });

    const columns = useConsumerDietsColumns({ sort });

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

    const [rows, setRows] = useRows<ClientCustomTable>(fetchedRows);

    const rowClick = useConsumerDietsRow({ setRows, dictionary, updateMessage, resetMessage });

    useEffect(() => {
        rowClick.onRowClick(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit, searchValue]);


    const { skeleton, table } = useConsumerDietsDataGrid({
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
        rowClick,
        sort: { sortName, sortDirection },
        filter,
        message: { messageObj, resetMessage, updateMessage },
        resetTable
    }
};
export default useConsumerDietsTable;