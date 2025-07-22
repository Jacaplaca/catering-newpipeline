import { api } from '@root/app/trpc/react';
import { type Session } from 'next-auth';
import { useState } from 'react';

const useOrderRow = ({
    session,
}: {
    session: Session | null
}) => {
    const role = session?.user.roleId;
    const isClient = role === 'client';
    const isManager = role === 'manager';
    const isKitchen = role === 'kitchen';
    const isManagerOrClient = isManager || isClient;
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    const isProperId = (id?: string | null) => {
        return typeof id === 'string' && id.length > 0;
    };

    const { data: orderForEdit, isFetching: orderForEditFetching }
        = api.specific.order.forEdit.useQuery(
            { id: expandedRowId ?? '' },
            { enabled: isProperId(expandedRowId) && isManagerOrClient }
        );

    const { data: orderForView, isFetching: orderForViewFetching }
        = api.specific.order.forView.useQuery(
            { id: expandedRowId ?? '' },
            { enabled: isProperId(expandedRowId) && (isManager || isKitchen) }
        );

    const onRowClick = (key: string | null) => {
        setExpandedRowId(state => state === key ? null : key);
    };

    return {
        onRowClick,
        expandedRowId,
        orderForEdit,
        orderForEditFetching,
        orderForView,
        orderForViewFetching,
    };
};

export default useOrderRow;