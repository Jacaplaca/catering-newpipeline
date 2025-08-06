import useRows from '@root/app/hooks/table/useRows';
import useTableSort from '@root/app/hooks/table/useTableSort';
import useMessage from '@root/app/hooks/useMessage';
import useColumns from '@root/app/specific/components/Food/Main/useColumns';
import useDataGrid from '@root/app/specific/components/Food/Main/useDataGrid';
import useFetch from '@root/app/specific/components/Food/Main/useFetch';
import useFoodFilter from '@root/app/specific/components/Food/Main/useFilter';
import useRow from '@root/app/specific/components/Food/Main/useRow';
import useAction from '@root/app/specific/components/Food/Main/useRowAction';
import { api } from '@root/app/trpc/react';
import { type SettingParsedType } from '@root/types';
import { type FoodCustomTable, type FoodSortName } from '@root/types/specific';
import { useEffect, useState } from 'react';

const useFoodTable = ({
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
    const utils = api.useUtils();
    const { messageObj, resetMessage, updateMessage } = useMessage(dictionary);
    const { sort, sortDirection, sortName } = useTableSort<FoodSortName>("name");
    const { foodCategory, allergens, addRemoveFoodCategory, addRemoveAllergen, search, searchValue } = useFoodFilter();


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
            limit,
            countIsFetching
        },
    } = useFetch({
        columns,
        sortName,
        sortDirection,
        filter: { foodCategory, allergens, searchValue },
    });


    const [rows, setRows] = useRows<FoodCustomTable>(fetchedRows);
    const [isAddOpen, setAddOpen] = useState(false);
    const addClose = () => { setAddOpen(false) }

    const rowClick = useRow({ setRows, refetchAll: resetTable, updateMessage, resetMessage, dictionary, afterSubmit: addClose });

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



    const addOpen = () => {
        rowClick.onRowClick(null);
        setAddOpen(true);
        void utils.specific.allergen.getMany.invalidate();
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
        countIsFetching,
        rowClick,
        sort: { sortName, sortDirection },
        action,
        message: { messageObj, resetMessage, updateMessage },
        filter: { foodCategory, allergens, addRemoveFoodCategory, addRemoveAllergen, search, searchValue },
        addModal: { isAddOpen, addOpen, addClose },
    }
};
export default useFoodTable;