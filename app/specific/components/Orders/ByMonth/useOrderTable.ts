import useRows from '@root/app/hooks/table/useRows';
import useTableSort from '@root/app/hooks/table/useTableSort';
import useMessage from '@root/app/hooks/useMessage';
import useSearch from '@root/app/hooks/useSearch';
import useFetchOrdersByMonth from '@root/app/specific/components/Orders/ByMonth/useFetch';
import useOrderGroupedByMonthDataGrid from '@root/app/specific/components/Orders/ByMonth/useDataGrid';
import useOrderGroupedByMonthColumns from '@root/app/specific/components/Orders/ByMonth/useColumns';
import { type SettingParsedType } from '@root/types';
import { type OrdersGroupedByMonthSortName, type OrderGroupedByMonthCustomTable } from '@root/types/specific';
import { type Session } from 'next-auth';
import { useEffect } from 'react';
import useMonth from '@root/app/specific/components/Orders/ByMonth/ExpandedRow/useMonth';

const useOrderByMonthTable = ({
    lang,
    pageName,
    settings,
    dictionary,
    clientId
}: {
    session: Session | null,
    lang: LocaleApp,
    pageName: string,
    settings: { main: SettingParsedType },
    dictionary: Record<string, string>,
    clientId?: string
}) => {
    const { messageObj, resetMessage, updateMessage } = useMessage(dictionary);
    const { sort, sortDirection, sortName } = useTableSort<OrdersGroupedByMonthSortName>("id", 'desc')
    const { searchValue, search } = useSearch({ lang, pageName });

    const columns = useOrderGroupedByMonthColumns({ sort });

    const {
        data: {
            totalCount,
            fetchedRows,
            isFetching
        },
        pagination: {
            page,
            limit
        },
    } = useFetchOrdersByMonth({
        sortName,
        columns,
        sortDirection,
        clientId
    });

    const [rows] = useRows<OrderGroupedByMonthCustomTable>(fetchedRows);

    const row = useMonth(clientId);

    useEffect(() => {
        void row.onClick(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit, searchValue]);

    const { skeleton, table } = useOrderGroupedByMonthDataGrid({
        rows,
        limit,
        totalCount,
        columns,
    })

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
        row,
        sort: { sortName, sortDirection },
        message: { messageObj, resetMessage, updateMessage },
    };
}
export default useOrderByMonthTable;

