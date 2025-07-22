import useTableColumns from '@root/app/hooks/clipboard/useTableColumns';
import useRows from '@root/app/hooks/table/useRows';
import useTableSort from '@root/app/hooks/table/useTableSort';
import useMessage from '@root/app/hooks/useMessage';
import useSearch from '@root/app/hooks/useSearch';
import useOrderColumns from '@root/app/specific/components/Orders/ByOrder/useColumns';
import useOrderDataGrid from '@root/app/specific/components/Orders/ByOrder/useDataGrid';
import useFetchOrders from '@root/app/specific/components/Orders/ByOrder/useFetch';
import useOrdersFilter from '@root/app/specific/components/Orders/ByOrder/useFilter';
import useOrder from '@root/app/specific/components/Orders/ByOrder/useOrder';
import useOrderRow from '@root/app/specific/components/Orders/ByOrder/useRow';
import useOrderAction from '@root/app/specific/components/Orders/ByOrder/useRowAction';
import { type SettingParsedType } from '@root/types';
import { type OrdersCustomTable, type OrdersSortName } from '@root/types/specific';
import { type Session } from 'next-auth';
import { useEffect, useState } from 'react';
import { useBoolean } from 'usehooks-ts';

const useOrderTable = ({
    session,
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
    clientId?: string,
}) => {
    const { messageObj, resetMessage, updateMessage } = useMessage(dictionary);
    const { sort, sortDirection, sortName } = useTableSort<OrdersSortName>("deliveryDay", 'desc')
    const { searchValue, search } = useSearch({ lang, pageName });
    const [orderIdForManager, setOrderIdForManager] = useState<string | null>(null);

    const filter = useOrdersFilter({ lang, pageName });

    const allColumns = useOrderColumns({ sort });

    const { showColumns, toggleColumn, columns } = useTableColumns({ key: 'orders_columns', allColumns });

    const { value: isAddOrderOpen, setTrue: addOrderOpen, setFalse: addOrderClose } = useBoolean(false);

    // const [isFocused, setIsFocused] = useState(false);
    // const [key, setKey] = useState(0);

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
    } = useFetchOrders({
        clientId: filter.clients.clientForFilter?.id ?? clientId,
        status: filter.status.statusForFilter,
        tagId: filter.tags.tagId,
        columns,
        showColumns,
        searchValue,
        sortName,
        sortDirection,
    });

    const [rows, setRows] = useRows<OrdersCustomTable>(fetchedRows);

    const rowClick = useOrderRow({ session });

    const action = useOrderAction({
        onSuccess: resetTable,
        rows: rows.map(el => el.id),
        session,
        updateMessage
    });

    useEffect(() => {
        action.uncheckAll();
        void rowClick.onRowClick(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit, searchValue]);

    const order = useOrder({
        addOrderClose,
        orderForEdit: rowClick.orderForEdit,
        newOrder: isAddOrderOpen,
        setRows,
        session,
        dictionary,
        updateMessage,
        resetMessage,
        clientId
    });

    const { skeleton, table } = useOrderDataGrid({
        rows,
        idsChecked: action.idsChecked,
        toggleCheck: action.toggleCheck,
        searchValue,
        limit,
        totalCount,
        columns,
        dictionary,
        roleId: session?.user.roleId
    })

    async function resetTable() {
        await countRefetch();
        await rowsRefetch();
        action.uncheckAll();
    }

    const openOrderModal = () => {
        rowClick.onRowClick(null);
        addOrderOpen();
        order.clearOrder();
    }

    const openOrderModalForManager = (orderId: string) => {
        setOrderIdForManager(orderId);
        // order.clearOrder();
    }

    return {
        roles: {
            isManager: session?.user.roleId === 'manager',
            isClient: session?.user.roleId === 'client',
            isKitchen: session?.user.roleId === 'kitchen',
            isDietician: session?.user.roleId === 'dietician',
        },
        clientId,
        pageName,
        lang,
        dictionary,
        settings,
        data: { table, skeleton },
        columns: { columns, showColumns, toggleColumn },
        isFetching,
        totalCount,
        search,
        rowClick,
        sort: { sortName, sortDirection },
        action,
        order,
        orderModal: { isOpen: isAddOrderOpen, open: openOrderModal, close: addOrderClose },
        filter,
        message: { messageObj, resetMessage, updateMessage },
        orderIdForManager,
        openOrderModalForManager
    };
}
export default useOrderTable;


// return {
//     pageName,
//     lang,
//     dictionary,
//     settings,
//     data: { table, skeleton },
//     columns: { columns, showColumns, toggleColumn },
//     isFetching,
//     totalCount,
//     search,
//     rowClick,
//     sort: { sortName, sortDirection },
//     action,
//     filter,

// }