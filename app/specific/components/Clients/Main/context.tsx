import type useClientTable from '@root/app/specific/components/Clients/Main/useClientTable';
import { createGenericContext } from '@root/app/specific/lib/contextGenerator';

type UseTable = ReturnType<typeof useClientTable>;

const {
    ContextProvider: TableContextProvider,
    useGenericContext: useClientTableContext
} = createGenericContext<UseTable>(
    "TableContext",
    "useTableContext must be used within a ClientTableContextProvider"
);

export { TableContextProvider, useClientTableContext };