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
import { type SettingParsedType } from '@root/types';
import ClientCategoryTable from '@root/app/specific/components/Clients/Category/index';
import ClientsMain from '@root/app/specific/components/Clients/Main';
import { ClientCategoryTableContextProvider } from '@root/app/specific/components/Clients/Category/context';
import useClientCategoryTable from '@root/app/specific/components/Clients/Category/useTable';

const ClientMainComponent: FunctionComponent<{
    lang: LocaleApp,
    pageName: string,
    dictionary: Record<string, string>,
    settings: { main: SettingParsedType },
}> = ({ lang, pageName, dictionary, settings }) => {

    return (
        <div>
            <Tabs
                aria-label="Tabs with underline" variant="default"
                title={translate(dictionary, 'clients:title')}
            >
                <FlowbiteTabs.Item active title={translate(dictionary, 'clients:clients_list')}>
                    {/* <FoodTableContextProvider store={useFoodTable(props)} > */}
                    <ClientsMain lang={lang} pageName={pageName} dictionary={dictionary} settings={settings} />
                    {/* </FoodTableContextProvider> */}
                </FlowbiteTabs.Item>
                <FlowbiteTabs.Item title={translate(dictionary, 'clients:categories_list')}>
                    {/* <OrderTableContextProvider store={useOrderTable(props)} > */}
                    <ClientCategoryTableContextProvider store={useClientCategoryTable({ lang, pageName, settings, dictionary })} >
                        <ClientCategoryTable />
                    </ClientCategoryTableContextProvider>
                    {/* </OrderTableContextProvider> */}
                </FlowbiteTabs.Item>
            </Tabs>
        </div>
    );
};

export default ClientMainComponent;