'use client';
import getDaysOfWeeks from '@root/app/specific/lib/getDaysOfWeeks';
import Tabs from '@root/app/_components/ui/Tabs';
import { TabItem } from 'flowbite-react';

import { pl } from 'date-fns/locale/pl';
import { registerLocale } from 'react-datepicker';
import { type FunctionComponent } from 'react';
import dateForWeekTabs from '@root/app/lib/date/dateForWeekTabs';
import useFetchConsumersWeekMenu from '@root/app/specific/components/PublicData/Consumer/useFetchConsumerWeekMenu';
import MenuView from '@root/app/specific/components/PublicData/Consumer/MenuView';
import translate from '@root/app/lib/lang/translate';

registerLocale('pl', pl);

const ConsumerPublicData: FunctionComponent<{
    lang: LocaleApp
    id: string
    dictionary: Record<string, string>
}> = ({ id, dictionary }) => {
    const daysOfWeeks = getDaysOfWeeks('wednesday');
    const { data, isFetching, updateDay } = useFetchConsumersWeekMenu({ consumerId: id, initialDate: daysOfWeeks[0] });

    const onActiveTabChange = (tabIndex: number) => {
        const activeDay = daysOfWeeks[tabIndex];
        updateDay(activeDay);
    }

    return (
        <div>
            {/* {activeDay && (
                <div className='text-xl font-medium mb-4'>
                    {`${format(activeDay, "d MMMM yyyy", { locale: pl })}`}
                </div>
            )} */}
            <Tabs
                aria-label="Tabs with underline"
                variant="default"
                title={"translate(dictionary, 'documents:tab_menu')"}
                onActiveTabChange={(tabIndex) => onActiveTabChange(tabIndex)}
            >
                {
                    daysOfWeeks.map((day) => {
                        const { dateRange } = dateForWeekTabs(day);
                        return (
                            <TabItem key={dateRange} title={dateRange}>
                                {isFetching ? <div className='flex justify-center items-center h-full p-4'>
                                    <i className='fas fa-spinner animate-spin text-4xl text-secondary-accent-accent dark:text-darkmode-secondary-accent-accent'></i>
                                </div> : <div className='flex flex-col gap-3'>
                                    {data ? <MenuView data={data} dictionary={dictionary} /> : <div>{translate(dictionary, 'public-profile:no_menu')}</div>}
                                </div>}
                            </TabItem>
                        )
                    })
                }
            </Tabs>
        </div>
    )
}

export default ConsumerPublicData;
