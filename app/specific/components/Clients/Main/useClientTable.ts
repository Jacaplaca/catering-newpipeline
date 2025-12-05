import useTableColumns from '@root/app/hooks/clipboard/useTableColumns';
import useRows from '@root/app/hooks/table/useRows';
import useTableSort from '@root/app/hooks/table/useTableSort';
import useMessage from '@root/app/hooks/useMessage';
import useSearch from '@root/app/hooks/useSearch';
import useClientColumns from '@root/app/specific/components/Clients/Main/useColumns';
import useClientDataGrid from '@root/app/specific/components/Clients/Main/useDataGrid';
import useFetchClients from '@root/app/specific/components/Clients/Main/useFetch';
import useFilter from '@root/app/specific/components/Clients/Main/useFilter';
import useClientRow from '@root/app/specific/components/Clients/Main/useRow';
import useClientAction from '@root/app/specific/components/Clients/Main/useRowAction';
import { type SettingParsedType } from '@root/types';
import { type ClientCustomTable, type ClientsSortName } from '@root/types/specific';
import { useEffect } from 'react';

const useClientTable = ({
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

    const allColumns = useClientColumns({ sort });

    const { showColumns, toggleColumn, columns } = useTableColumns({ key: 'clients_columns', allColumns });

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
    } = useFetchClients({
        tagId: filter.tags.tagId,
        columns,
        showColumns,
        searchValue,
        sortName,
        sortDirection,
    });

    const [rows, setRows] = useRows<ClientCustomTable>(fetchedRows);

    const rowClick = useClientRow({ setRows, dictionary, updateMessage, resetMessage });

    const action = useClientAction({
        onSuccess: resetTable,
        rows: rows.map(el => el.id),
    });

    useEffect(() => {
        action.uncheckAll();
        rowClick.onRowClick(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit, searchValue]);


    const { skeleton, table } = useClientDataGrid({
        rows,
        idsChecked: action.idsChecked,
        toggleCheck: action.toggleCheck,
        searchValue,
        limit,
        totalCount,
        columns,
    })

    async function resetTable() {
        await countRefetch();
        await rowsRefetch();
        action.uncheckAll();
        rowClick.onRowClick(null);
    }



    return {
        pageName,
        lang,
        dictionary,
        settings,
        data: { table, skeleton },
        columns: { showColumns, toggleColumn, columns },
        isFetching,
        totalCount,
        search,
        rowClick,
        sort: { sortName, sortDirection },
        action,
        filter,
        message: { messageObj, resetMessage, updateMessage }
    }
};
export default useClientTable;