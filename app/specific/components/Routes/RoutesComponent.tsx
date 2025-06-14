'use client';
import { type RoleType } from '@prisma/client';
import { RouteTableContextProvider } from '@root/app/specific/components/Routes/context';
import RoutesTable from '@root/app/specific/components/Routes/RoutesTable';
import useRouteTable from '@root/app/specific/components/Routes/useRouteTable';
import { type SettingParsedType } from '@root/types';
import { SessionProvider } from 'next-auth/react';
import { type FunctionComponent } from 'react';

const RoutesComponent: FunctionComponent<{
    lang: LocaleApp
    pageName: string
    dictionary: Record<string, string>
    settings: { main: SettingParsedType }
    clientId?: string
    userRole?: RoleType
}> = (props) => {

    return (
        <SessionProvider>
            <RouteTableContextProvider store={useRouteTable({ ...props })} >
                <RoutesTable />
            </RouteTableContextProvider>
        </SessionProvider >
    );
};

export default RoutesComponent;