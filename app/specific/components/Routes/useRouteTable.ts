import { type DeliveryRoute } from '@prisma/client';
import useRows from '@root/app/hooks/table/useRows';
import useTableSort from '@root/app/hooks/table/useTableSort';
import useMessage from '@root/app/hooks/useMessage';
import useRouteColumns from '@root/app/specific/components/Routes/useColumns';
import useRoutesDataGrid from '@root/app/specific/components/Routes/useDataGrid';
import useFetchRoutes from '@root/app/specific/components/Routes/useFetch';
import useRouteRow from '@root/app/specific/components/Routes/useRow';
import useRouteAction from '@root/app/specific/components/Routes/useRowAction';
import { type SettingParsedType } from '@root/types';
import { type RouteSortName } from '@root/types/specific';
import { useEffect } from 'react';

const useRouteTable = ({
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
    const { sort, sortDirection, sortName } = useTableSort<RouteSortName>("name")


    const columns = useRouteColumns({ sort });

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
    } = useFetchRoutes({
        columns,
        sortName,
        sortDirection,
    });


    const [rows, setRows] = useRows<DeliveryRoute>(fetchedRows);

    const rowClick = useRouteRow({ setRows, refetchAll: resetTable, updateMessage, resetMessage, dictionary });

    const action = useRouteAction({
        onSuccess: resetTable,
        rows: rows.map(el => el.id),
    });

    useEffect(() => {
        action.uncheckAll();
        void rowClick.onRowClick(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit]);


    const { skeleton, table } = useRoutesDataGrid({
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
export default useRouteTable;