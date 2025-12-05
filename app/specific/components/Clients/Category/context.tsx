import { createGenericContext } from '@root/app/specific/lib/contextGenerator';
import type useClientCategoryTable from './useTable';
type UseTable = ReturnType<typeof useClientCategoryTable>;

const {
    ContextProvider: ClientCategoryTableContextProvider,
    useGenericContext: useClientCategoryTableContext
} = createGenericContext<UseTable>(
    "TableContext",
    "useClientCategoryTableContext must be used within a ClientCategoryTableContextProvider"
);

export { ClientCategoryTableContextProvider, useClientCategoryTableContext };