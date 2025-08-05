import useRows from '@root/app/hooks/table/useRows';
import useTableSort from '@root/app/hooks/table/useTableSort';
import useMessage from '@root/app/hooks/useMessage';
import useSearch from '@root/app/hooks/useSearch';
import useByClientAndMonthDataGrid from '@root/app/specific/components/Orders/ByClientAndMonth/useDataGrid';
import { type SettingParsedType } from '@root/types';
import { type OrdersGroupedByClientAndMonthSortName, type OrderGroupedByClientAndMonthCustomTable } from '@root/types/specific';
import { type Session } from 'next-auth';
import { useEffect } from 'react';
import useByClientAndMonthColumns from '@root/app/specific/components/Orders/ByClientAndMonth/useColumns';
import useFetchByClientAndMonth from '@root/app/specific/components/Orders/ByClientAndMonth/useFetch';
import useDeliveryMonth from '@root/app/specific/components/Orders/ByClientAndMonth/useDeliveryMonth';
import useClientMonth from '@root/app/specific/components/Orders/ByClientAndMonth/ExpandedRow/useClientMonth';
import useFetchMonthSummary from '@root/app/specific/components/Orders/ByClientAndMonth/useFetchMonthSummary';

const useByClientAndMonthTable = ({
    session,
    lang,
    pageName,
    settings,
    dictionary,
}: {
    session: Session | null,
    lang: LocaleApp,
    pageName: string,
    settings: { main: SettingParsedType },
    dictionary: Record<string, string>,
}) => {
    const { messageObj, resetMessage, updateMessage } = useMessage(dictionary);
    const { sort, sortDirection, sortName } = useTableSort<OrdersGroupedByClientAndMonthSortName>("id", 'desc')
    const { searchValue, search } = useSearch({ lang, pageName });
    const month = useDeliveryMonth();

    const columns = useByClientAndMonthColumns({ sort });

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
    } = useFetchByClientAndMonth({
        sortName,
        columns,
        sortDirection,
        deliveryMonth: month.deliveryMonth
    });

    const monthSummary = useFetchMonthSummary({
        deliveryMonth: month.deliveryMonth
    });

    const [rows] = useRows<OrderGroupedByClientAndMonthCustomTable>(fetchedRows);

    const row = useClientMonth(month.deliveryMonth);

    useEffect(() => {
        void row.onClick(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit, searchValue]);

    const { skeleton, table } = useByClientAndMonthDataGrid({
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
        month,
        monthSummary
    };
}
export default useByClientAndMonthTable;

