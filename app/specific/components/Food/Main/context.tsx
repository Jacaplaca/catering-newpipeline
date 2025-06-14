import { createGenericContext } from '@root/app/specific/lib/contextGenerator';
import type useFoodTable from './useTable';
type UseTable = ReturnType<typeof useFoodTable>;

const {
    ContextProvider: FoodTableContextProvider,
    useGenericContext: useFoodTableContext
} = createGenericContext<UseTable>(
    "TableContext",
    "useFoodTableContext must be used within a FoodTableContextProvider"
);

export { FoodTableContextProvider as FoodTableContextProvider, useFoodTableContext };