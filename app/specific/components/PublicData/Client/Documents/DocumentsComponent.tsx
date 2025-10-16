'use client';
import getDaysOfWeeks from '@root/app/specific/lib/getDaysOfWeeks';
import Tabs from '@root/app/_components/ui/Tabs';
import { Tabs as FlowbiteTabs } from 'flowbite-react';

import { pl } from 'date-fns/locale/pl';
import { registerLocale } from 'react-datepicker';
import { format } from 'date-fns-tz';
import { type FunctionComponent } from 'react';
import { type ClientFileType, type ClientFile } from '@prisma/client';
import Link from 'next/link';
import translate from '@root/app/lib/lang/translate';
import makeHref from '@root/app/lib/url/makeHref';
import WeekMenuForClientPdf from '@root/app/specific/components/PublicData/Client/Documents/WeekMenuForClient';
import dateForWeekTabs from '@root/app/lib/date/dateForWeekTabs';

registerLocale('pl', pl);

const transMap: Record<ClientFileType, string> = {
    'menu': 'documents:menu',
    'diets': 'documents:diet',
    'checklist': 'documents:checklist',
};

const DocumentsComponent: FunctionComponent<{
    lang: LocaleApp
    clientId: string
    clientFiles: ClientFile[]
    dictionary: Record<string, string>
}> = ({ clientFiles, dictionary, lang, clientId }) => {
    const daysOfWeeks = getDaysOfWeeks('wednesday');
    return (
        <div>
            <Tabs aria-label="Tabs with underline" variant="default" title={translate(dictionary, 'documents:tab_menu')}>
                {
                    daysOfWeeks.map((day) => {
                        const { weekStart, weekEnd, weekObj, dateRange } = dateForWeekTabs(day);
                        return (
                            <FlowbiteTabs.Item key={dateRange} title={dateRange}>
                                <div className='flex flex-col gap-3'>
                                    <div
                                        className='text-xl font-medium mb-4'>
                                        {`${format(weekStart, "d MMMM yyyy", { locale: pl })} - ${format(weekEnd, "d MMMM yyyy", { locale: pl })}`}
                                    </div>

                                    <div className='flex flex-col items-start gap-3'>
                                        <div className='flex flex-col gap-3'>
                                            {
                                                clientFiles.filter((file) => file.week.week === weekObj.week && file.week.year === weekObj.weekYear).map(({ id, fileType, s3Key }) => {
                                                    return (
                                                        <Link
                                                            key={id}
                                                            href={makeHref({ lang, page: 'file', slugs: [s3Key] })} target='_blank'
                                                            className='flex gap-2 items-center hover:underline group'>
                                                            <div className='text-base font-medium'>{translate(dictionary, transMap[fileType])}</div>
                                                            <i className="text-xl fa-solid fa-file-circle-check text-base text-neutral-500 group-hover:text-secondary-accent dark:text-secondary-accent-dark" />
                                                        </Link>
                                                    )
                                                })
                                            }
                                        </div>
                                        <div className='flex items-start gap-3'>
                                            <p>{translate(dictionary, 'documents:week_menu')}</p>
                                            <WeekMenuForClientPdf
                                                clientId={clientId}
                                                lang={lang}
                                                dictionary={dictionary}
                                                day={weekStart}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </FlowbiteTabs.Item>
                        )
                    })
                }
            </Tabs>
        </div>
    )
}

export default DocumentsComponent;
