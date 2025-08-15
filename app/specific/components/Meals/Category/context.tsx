import { createGenericContext } from '@root/app/specific/lib/contextGenerator';
import type useMealCategoryTable from './useTable';
type UseTable = ReturnType<typeof useMealCategoryTable>;

const {
    ContextProvider: MealCategoryTableContextProvider,
    useGenericContext: useMealCategoryTableContext
} = createGenericContext<UseTable>(
    "TableContext",
    "useMealCategoryTableContext must be used within a MealCategoryTableContextProvider"
);

export { MealCategoryTableContextProvider, useMealCategoryTableContext };