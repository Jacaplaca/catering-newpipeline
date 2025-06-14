import type useConsumerDietsTable from '@root/app/specific/components/FoodMenu/ConsumerDiets/useConsumerDietsTable';
import { createGenericContext } from '@root/app/specific/lib/contextGenerator';

type UseTable = ReturnType<typeof useConsumerDietsTable>;

const {
    ContextProvider: TableContextProvider,
    useGenericContext: useConsumerDietsTableContext
} = createGenericContext<UseTable>(
    "TableContext",
    "useTableContext must be used within a ConsumerDietsTableContextProvider"
);

export { TableContextProvider, useConsumerDietsTableContext };