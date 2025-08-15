import { createGenericContext } from '@root/app/specific/lib/contextGenerator';
import type useMealTable from '@root/app/specific/components/Meals/Main/useTable';

type UseTable = ReturnType<typeof useMealTable>;

const {
    ContextProvider: MealTableContextProvider,
    useGenericContext: useMealTableContext
} = createGenericContext<UseTable>(
    "TableContext",
    "useMealTableContext must be used within a MealTableContextProvider"
);

export { MealTableContextProvider, useMealTableContext };