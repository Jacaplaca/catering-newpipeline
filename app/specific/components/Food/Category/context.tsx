import { createGenericContext } from '@root/app/specific/lib/contextGenerator';
import type useFoodCategoryTable from './useTable';
type UseTable = ReturnType<typeof useFoodCategoryTable>;

const {
    ContextProvider: FoodCategoryTableContextProvider,
    useGenericContext: useFoodCategoryTableContext
} = createGenericContext<UseTable>(
    "TableContext",
    "useFoodCategoryTableContext must be used within a FoodCategoryTableContextProvider"
);

export { FoodCategoryTableContextProvider, useFoodCategoryTableContext };