'use client';
import { type FunctionComponent } from 'react';
// import Tabs from '@root/app/_components/ui/Tabs';
// import translate from '@root/app/lib/lang/translate';
// import { Tabs as FlowbiteTabs } from 'flowbite-react';
import { type SettingParsedType } from '@root/types';
import useMealTable from '@root/app/specific/components/Meals/Main/useTable';
import { MealTableContextProvider } from '@root/app/specific/components/Meals/Main/context';
import MealsTable from '@root/app/specific/components/Meals/Main/Table';
// import { MealCategoryTableContextProvider } from '@root/app/specific/components/Meals/Category/context';
// import MealCategoryTable from '@root/app/specific/components/Meals/Category';
// import useMealCategoryTable from '@root/app/specific/components/Meals/Category/useTable';

const MealMainComponent: FunctionComponent<{
    lang: LocaleApp,
    pageName: string,
    dictionary: Record<string, string>,
    settings: { main: SettingParsedType },
}> = (props) => {

    return (
        <div>
            {/* <Tabs
                aria-label="Tabs with underline" variant="default"
                title={translate(props.dictionary, 'meals:title')}
            > */}
            {/* <FlowbiteTabs.Item active title={translate(props.dictionary, 'meals:title')}> */}
            <MealTableContextProvider store={useMealTable({ ...props })} >
                <MealsTable />
            </MealTableContextProvider>
            {/* </FlowbiteTabs.Item> */}
            {/* <FlowbiteTabs.Item title={translate(props.dictionary, 'meals:categories')}>
                    <MealCategoryTableContextProvider store={useMealCategoryTable({ ...props })} >
                        <MealCategoryTable />
                    </MealCategoryTableContextProvider>
                </FlowbiteTabs.Item> */}
            {/* </Tabs> */}
        </div>
    );
};

export default MealMainComponent;