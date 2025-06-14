import useParam from '@root/app/hooks/useParam';
import { useState } from 'react';

const useFilterConsumers = ({
    lang,
    pageName,
}: {
    lang: LocaleApp
    pageName: string
}) => {
    const setParam = useParam({ lang, pageName });
    const [clientForFilter, setClientForFilter] = useState<{ id: string, name: string, code: string | number } | null>(null);

    function chooseClient(item: { id: string, name: string, code: string | number } | null) {
        setClientForFilter(item ?? null)
        setParam({ param: ['page', 1], slugs: [], withDomain: true });
    }

    return {
        clients: {
            chooseClient,
            clientForFilter,
        }
    };
}

export default useFilterConsumers;