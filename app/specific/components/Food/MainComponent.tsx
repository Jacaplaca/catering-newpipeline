'use client';
// import { RoleType } from '@prisma/client';
// import ClientOrdersComponent from '@root/app/specific/components/Orders/ClientOrdersComponent';
// import OrdersComponent from '@root/app/specific/components/Orders/OrdersComponent';
import { type FunctionComponent } from 'react';
// import { auth } from '@root/app/server/auth';
// import { OrderTableContextProvider } from '@root/app/specific/components/Orders/ByOrder/context';
import Tabs from '@root/app/_components/ui/Tabs';
import translate from '@root/app/lib/lang/translate';
// import { ByClientAndMonthTableContextProvider } from '@root/app/specific/components/Orders/ByClientAndMonth/context';
import { Tabs as FlowbiteTabs } from 'flowbite-react';
import { FoodCategoryTableContextProvider } from '@root/app/specific/components/Food/Category/context';
import useFoodCategoryTable from '@root/app/specific/components/Food/Category/useTable';
import { type SettingParsedType } from '@root/types';
import FoodCategoryTable from '@root/app/specific/components/Food/Category';
import { FoodTableContextProvider } from '@root/app/specific/components/Food/Main/context';
import useFoodTable from '@root/app/specific/components/Food/Main/useTable';
import FoodTable from '@root/app/specific/components/Food/Main';

const FoodMainComponent: FunctionComponent<{
    lang: LocaleApp,
    pageName: string,
    dictionary: Record<string, string>,
    settings: { main: SettingParsedType },
}> = (props) => {



    return (
        <div>
            <Tabs
                aria-label="Tabs with underline" variant="default"
                title={translate(props.dictionary, 'food:title')}
            >
                <FlowbiteTabs.Item active title={translate(props.dictionary, 'food:food_dishes')}>
                    <FoodTableContextProvider store={useFoodTable(props)} >
                        <FoodTable />
                    </FoodTableContextProvider>
                </FlowbiteTabs.Item>
                <FlowbiteTabs.Item title={translate(props.dictionary, 'food:categories')}>
                    {/* <OrderTableContextProvider store={useOrderTable(props)} > */}
                    <FoodCategoryTableContextProvider store={useFoodCategoryTable(props)} >
                        <FoodCategoryTable />
                    </FoodCategoryTableContextProvider>
                    {/* </OrderTableContextProvider> */}
                </FlowbiteTabs.Item>
            </Tabs>
        </div>
    );
};

export default FoodMainComponent;