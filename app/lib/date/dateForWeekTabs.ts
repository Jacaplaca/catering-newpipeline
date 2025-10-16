

import { pl } from 'date-fns/locale/pl';
import { registerLocale } from 'react-datepicker';
import { startOfWeek, endOfWeek } from 'date-fns';
import { format } from 'date-fns-tz';
import dateToWeek from '@root/app/specific/lib/dateToWeek';

registerLocale('pl', pl);

const dateForWeekTabs = (day: Date) => {
    const date = new Date(day ?? '');
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
    const { week, weekYear } = dateToWeek(date);

    const dateFormat = weekStart.getFullYear() !== weekEnd.getFullYear() ? 'd MMM yyyy' : 'd MMM';
    const dateRange = `${format(weekStart, dateFormat, { locale: pl })} - ${format(weekEnd, dateFormat, { locale: pl })} (${week}/${weekYear})`;
    const weekObj = dateToWeek(day);
    return { weekStart, weekEnd, weekObj, dateRange };
}

export default dateForWeekTabs;