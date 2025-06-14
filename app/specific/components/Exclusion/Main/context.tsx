import { createGenericContext } from '@root/app/specific/lib/contextGenerator';
import type useExclusionTable from './useTable';
type UseTable = ReturnType<typeof useExclusionTable>;

const {
    ContextProvider: ExclusionTableContextProvider,
    useGenericContext: useExclusionTableContext
} = createGenericContext<UseTable>(
    "TableContext",
    "useExclusionTableContext must be used within a ExclusionTableContextProvider"
);

export { ExclusionTableContextProvider as ExclusionTableContextProvider, useExclusionTableContext };