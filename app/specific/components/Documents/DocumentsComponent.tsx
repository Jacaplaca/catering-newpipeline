'use client';
import getDaysOfWeeks from '@root/app/specific/lib/getDaysOfWeeks';
import Tabs from '@root/app/_components/ui/Tabs';
import { Tabs as FlowbiteTabs } from 'flowbite-react';

import { pl } from 'date-fns/locale/pl';
import { registerLocale } from 'react-datepicker';
import { startOfWeek, endOfWeek } from 'date-fns';
import { format } from 'date-fns-tz';
import dateToWeek from '@root/app/specific/lib/dateToWeek';
import { type FunctionComponent } from 'react';
import { type ClientFileType, type ClientFile } from '@prisma/client';
import Link from 'next/link';
import translate from '@root/app/lib/lang/translate';
import makeHref from '@root/app/lib/url/makeHref';

registerLocale('pl', pl);

const transMap: Record<ClientFileType, string> = {
    'menu': 'documents:menu',
    'diets': 'documents:diet',
    'checklist': 'documents:checklist',
};

const DocumentsComponent: FunctionComponent<{
    lang: LocaleApp
    clientFiles: ClientFile[]
    dictionary: Record<string, string>
}> = ({ clientFiles, dictionary, lang }) => {
    const daysOfWeeks = getDaysOfWeeks('wednesday');
    return (
        <div>
            <Tabs aria-label="Tabs with underline" variant="default" title={translate(dictionary, 'documents:tab_menu')}>
                {
                    daysOfWeeks.map((day) => {
                        const date = new Date(day ?? '');
                        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
                        const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
                        const { week, weekYear } = dateToWeek(date);

                        const dateFormat = weekStart.getFullYear() !== weekEnd.getFullYear() ? 'd MMM yyyy' : 'd MMM';
                        const dateRange = `${format(weekStart, dateFormat, { locale: pl })} - ${format(weekEnd, dateFormat, { locale: pl })} (${week}/${weekYear})`;
                        const weekObj = dateToWeek(day);
                        return (
                            <FlowbiteTabs.Item key={dateRange} title={dateRange}>
                                <div className='flex flex-col gap-3'>
                                    <div
                                        className='text-xl font-medium mb-4'>
                                        {`${format(weekStart, "d MMMM yyyy", { locale: pl })} - ${format(weekEnd, "d MMMM yyyy", { locale: pl })}`}
                                    </div>
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
