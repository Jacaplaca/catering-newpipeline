import type useOrderByDayMealsTable from '@root/app/specific/components/Orders/ByDayMeals/useOrderMealsTable';
import { createGenericContext } from '@root/app/specific/lib/contextGenerator';

type UseTable = ReturnType<typeof useOrderByDayMealsTable>;

const {
    ContextProvider: OrderByDayMealsTableContextProvider,
    useGenericContext: useOrderByDayMealsTableContext
} = createGenericContext<UseTable>(
    "OrderByDayMealsTableContext",
    "useOrderByDayMealsTableContext must be used within a OrderByDayMealsTableContextProvider"
);

export { OrderByDayMealsTableContextProvider, useOrderByDayMealsTableContext };