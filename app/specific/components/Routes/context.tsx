import type useRouteTable from '@root/app/specific/components/Routes/useRouteTable';
import { createGenericContext } from '@root/app/specific/lib/contextGenerator';

type UseTable = ReturnType<typeof useRouteTable>;

const {
    ContextProvider: RouteTableContextProvider,
    useGenericContext: useRouteTableContext
} = createGenericContext<UseTable>(
    "TableContext",
    "useTableContext must be used within a RouteTableContextProvider"
);

export { RouteTableContextProvider, useRouteTableContext };