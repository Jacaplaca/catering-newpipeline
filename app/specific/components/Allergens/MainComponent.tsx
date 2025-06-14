'use client';
import { type RoleType } from '@prisma/client';
import useAllergenTable from '@root/app/specific/components/Allergens/useTable';
import { AllergenTableContextProvider } from '@root/app/specific/components/Allergens/context';
import AllergensTable from '@root/app/specific/components/Allergens/Table';
import { type SettingParsedType } from '@root/types';
import { SessionProvider } from 'next-auth/react';
import { type FunctionComponent } from 'react';

const MainComponent: FunctionComponent<{
    lang: LocaleApp
    pageName: string
    dictionary: Record<string, string>
    settings: { main: SettingParsedType }
    clientId?: string
    userRole?: RoleType
}> = (props) => {

    return (
        <SessionProvider>
            <AllergenTableContextProvider store={useAllergenTable({ ...props })} >
                <AllergensTable />
            </AllergenTableContextProvider>
        </SessionProvider >
    );
};

export default MainComponent;