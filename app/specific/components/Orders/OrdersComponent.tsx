'use client';
import { type SettingParsedType } from '@root/types';
import { type FunctionComponent } from 'react';
import OrdersTable from '@root/app/specific/components/Orders/ByOrder/OrdersTable';
import { SessionProvider } from 'next-auth/react';
import { type Session } from 'next-auth';
import translate from '@root/app/lib/lang/translate';
import Tabs from '@root/app/_components/ui/Tabs';
import { Tabs as FlowbiteTabs } from 'flowbite-react';
import OrdersByDayTable from '@root/app/specific/components/Orders/ByDay/OrdersTable';
import { OrderTableContextProvider } from '@root/app/specific/components/Orders/ByOrder/context';
import useOrderTable from '@root/app/specific/components/Orders/ByOrder/useOrderTable';
import { OrderByDayTableContextProvider } from '@root/app/specific/components/Orders/ByDay/context';
import useOrderByDayTable from '@root/app/specific/components/Orders/ByDay/useOrderTable';
import useByClientAndMonthTable from '@root/app/specific/components/Orders/ByClientAndMonth/useByClientAndMonthTable';
import { ByClientAndMonthTableContextProvider } from '@root/app/specific/components/Orders/ByClientAndMonth/context';
import ByClientAndMonth from '@root/app/specific/components/Orders/ByClientAndMonth';
import { RoleType } from '@prisma/client';

const OrdersComponent: FunctionComponent<{
    lang: LocaleApp
    pageName: string
    dictionary: Record<string, string>
    settings: { main: SettingParsedType }
    session: Session | null
    clientId?: string
}> = (props) => {


    const { user } = props.session ?? {};
    const showForManager = user?.roleId === RoleType.manager;

    return (
        <SessionProvider session={props.session}>
            <Tabs aria-label="Tabs with underline" variant="default" title={translate(props.dictionary, 'orders:title')}>
                <FlowbiteTabs.Item active title={translate(props.dictionary, 'orders:orders_by_day')}>
                    <OrderByDayTableContextProvider store={useOrderByDayTable(props)} >
                        <OrdersByDayTable />
                    </OrderByDayTableContextProvider>
                </FlowbiteTabs.Item>
                <FlowbiteTabs.Item title={translate(props.dictionary, 'orders:orders_by_order')}>
                    <OrderTableContextProvider store={useOrderTable(props)} >
                        <OrdersTable />
                    </OrderTableContextProvider>
                </FlowbiteTabs.Item>
                <FlowbiteTabs.Item title={translate(props.dictionary, 'orders:orders_by_client_and_month')}>
                    <ByClientAndMonthTableContextProvider store={useByClientAndMonthTable(props)} >
                        {showForManager && <ByClientAndMonth dictionary={props.dictionary} />}
                    </ByClientAndMonthTableContextProvider>
                </FlowbiteTabs.Item>
            </Tabs>
        </SessionProvider>
    );
};

export default OrdersComponent;