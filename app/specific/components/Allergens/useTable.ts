import { type Allergen } from '@prisma/client';
import useRows from '@root/app/hooks/table/useRows';
import useTableSort from '@root/app/hooks/table/useTableSort';
import useMessage from '@root/app/hooks/useMessage';
import useColumns from '@root/app/specific/components/Allergens/useColumns';
import useDataGrid from '@root/app/specific/components/Allergens/useDataGrid';
import useFetch from '@root/app/specific/components/Allergens/useFetch';
import useRow from '@root/app/specific/components/Allergens/useRow';
import useAction from '@root/app/specific/components/Allergens/useRowAction';
import { type SettingParsedType } from '@root/types';
import { type AllergenSortName } from '@root/types/specific';
import { useEffect } from 'react';

const useAllergenTable = ({
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
    const { sort, sortDirection, sortName } = useTableSort<AllergenSortName>("name")


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
    });


    const [rows, setRows] = useRows<Allergen>(fetchedRows);

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
    }
};
export default useAllergenTable;