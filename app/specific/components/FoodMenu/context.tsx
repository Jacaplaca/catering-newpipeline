import { createGenericContext } from '@root/app/specific/lib/contextGenerator';
import type useFoodMenu from './useFoodMenu';
type UseTable = ReturnType<typeof useFoodMenu>;

const {
    ContextProvider: FoodMenuContextProvider,
    useGenericContext: useFoodMenuContext
} = createGenericContext<UseTable>(
    "FoodMenuContext",
    "useFoodMenuContext must be used within a FoodMenuContextProvider"
);

export { FoodMenuContextProvider as FoodMenuContextProvider, useFoodMenuContext };