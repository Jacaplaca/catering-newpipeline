import dateToWeek from '@root/app/specific/lib/dateToWeek';
import { format } from 'date-fns-tz';
import { pl } from 'date-fns/locale';

const getFooterText = ({ dayDate, clientCode, i, range, week }: { dayDate: Date, clientCode?: string | null, i: number, range: { start: number, count: number, }, week: boolean }): string => {
    const footerDate = format(dayDate, "d-MM-yyyy ", { locale: pl });

    let footerText = `${footerDate}     ${i + 1}/${range.count}`;

    if (clientCode) {
        if (!week) {
            footerText = `${clientCode}     ${footerDate}     ${i + 1}/${range.count}`;
        } else {
            const { week, weekYear } = dateToWeek(dayDate);
            footerText = `${clientCode}     ${week}/${weekYear}     ${i + 1}/${range.count}`;
        }
    }

    return footerText;
}

export default getFooterText;