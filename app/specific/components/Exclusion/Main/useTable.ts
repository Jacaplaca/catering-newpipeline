import { useEffect } from 'react';
import useRows from '@root/app/hooks/table/useRows';
import useTableSort from '@root/app/hooks/table/useTableSort';
import useMessage from '@root/app/hooks/useMessage';
import useColumns from '@root/app/specific/components/Exclusion/Main/useColumns';
import useDataGrid from '@root/app/specific/components/Exclusion/Main/useDataGrid';
import useFetch from '@root/app/specific/components/Exclusion/Main/useFetch';
import useExclusionFilter from '@root/app/specific/components/Exclusion/Main/useFilter';
import useRow from '@root/app/specific/components/Exclusion/Main/useRow';
import useAction from '@root/app/specific/components/Exclusion/Main/useRowAction';
import { type SettingParsedType } from '@root/types';
import { type ExclusionCustomTable, type ExclusionSortName } from '@root/types/specific';

const useExclusionTable = ({
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
    const { sort, sortDirection, sortName } = useTableSort<ExclusionSortName>("name");
    const { allergens, addRemoveAllergen, search, searchValue } = useExclusionFilter();


    const columns = useColumns({ sort });

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
    } = useFetch({
        columns,
        sortName,
        sortDirection,
        filter: { allergens, searchValue },
    });


    const [rows, setRows] = useRows<ExclusionCustomTable>(fetchedRows);

    const rowClick = useRow({ setRows, refetchAll: resetTable, updateMessage, resetMessage, dictionary });

    const action = useAction({
        onSuccess: resetTable,
        rows: rows.map(el => el.id),
    });

    useEffect(() => {
        action.uncheckAll();
        void rowClick.onRowClick(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit]);


    const { skeleton, table } = useDataGrid({
        rows,
        idsChecked: action.idsChecked,
        toggleCheck: action.toggleCheck,
        limit,
        totalCount,
        columns,
    })


    async function resetTable() {
        await countRefetch();
        await rowsRefetch();
        action.uncheckAll();
    }

    return {
        pageName,
        lang,
        dictionary,
        settings,
        data: { table, skeleton },
        columns: { columns },
        isFetching,
        totalCount,
        rowClick,
        sort: { sortName, sortDirection },
        action,
        message: { messageObj, resetMessage, updateMessage },
        filter: { allergens, addRemoveAllergen, search, searchValue },
    }
};
export default useExclusionTable;