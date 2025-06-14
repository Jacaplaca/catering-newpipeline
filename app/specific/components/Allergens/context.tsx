import type useAllergenTable from '@root/app/specific/components/Allergens/useTable';
import { createGenericContext } from '@root/app/specific/lib/contextGenerator';

type UseTable = ReturnType<typeof useAllergenTable>;

const {
    ContextProvider: AllergenTableContextProvider,
    useGenericContext: useAllergenTableContext
} = createGenericContext<UseTable>(
    "TableContext",
    "useAllergenTableContext must be used within a AllergenTableContextProvider"
);

export { AllergenTableContextProvider, useAllergenTableContext };