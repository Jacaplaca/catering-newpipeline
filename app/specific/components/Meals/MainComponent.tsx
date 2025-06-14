'use client';
import { type RoleType } from '@prisma/client';
import { type SettingParsedType } from '@root/types';
import { SessionProvider } from 'next-auth/react';
import { type FunctionComponent } from 'react';
import { MealTableContextProvider } from '@root/app/specific/components/Meals/context';
import MealsTable from '@root/app/specific/components/Meals/Table';
import useMealTable from '@root/app/specific/components/Meals/useTable';

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
            <MealTableContextProvider store={useMealTable({ ...props })} >
                <MealsTable />
            </MealTableContextProvider>
        </SessionProvider >
    );
};

export default MainComponent;