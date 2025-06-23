'use client';
import { type FunctionComponent } from 'react';
import { type SettingParsedType } from '@root/types';
import { FoodMenuContextProvider } from '@root/app/specific/components/FoodMenu/context';
import useFoodMenu from '@root/app/specific/components/FoodMenu/useFoodMenu';
import MenuCreator from './MenuCreator';
const FoodMenuComponent: FunctionComponent<{
    lang: LocaleApp,
    pageName: string,
    dictionary: Record<string, string>,
    settings: { main: SettingParsedType },
}> = (props) => {

    return (
        <FoodMenuContextProvider store={useFoodMenu(props)} >
            <MenuCreator />
        </FoodMenuContextProvider>
    );
};

export default FoodMenuComponent;