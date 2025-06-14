import { type OrderStatus } from '@prisma/client';
import useFilterByTagId from '@root/app/hooks/table/useFilterByTagId';
import useParam from '@root/app/hooks/useParam';
import { useState } from 'react';

const useOrdersFilter = ({
    lang,
    pageName,
}: {
    lang: LocaleApp
    pageName: string
}) => {
    const setParam = useParam({ lang, pageName });
    const tags = useFilterByTagId({ lang, pageName });
    const [clientForFilter, setClientForFilter] = useState<{ id: string, name: string, code: string | number } | null>(null);
    const [statusForFilter, setStatusForFilter] = useState<OrderStatus | null>(null);

    function chooseClient(item: { id: string, name: string, code: string | number } | null) {
        setClientForFilter(item ?? null)
        // setTagForFilter(allItems.find(item => item.id === id) ?? null)
        setParam({ param: ['page', 1], slugs: [], withDomain: true });
    }

    function chooseStatus(status: OrderStatus | null) {
        setStatusForFilter(status)
        setParam({ param: ['page', 1], slugs: [], withDomain: true });
    }


    return {
        clients: {
            chooseClient,
            clientForFilter,
        },
        status: {
            chooseStatus,
            statusForFilter,
        },
        tags
    };
}

export default useOrdersFilter;