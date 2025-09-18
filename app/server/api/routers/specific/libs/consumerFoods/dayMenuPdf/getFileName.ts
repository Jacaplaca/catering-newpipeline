import dateToWeek from '@root/app/specific/lib/dateToWeek';
import { format } from 'date-fns-tz';
import { pl } from 'date-fns/locale';

const getFileName = ({ dayDate, clientCode, isWeek }: { dayDate: Date, clientCode?: string | null, isWeek: boolean }): string => {
    const fileNameDate = format(dayDate, "yyyy-MM-dd ", { locale: pl });
    let fileName = `jadlospis_${fileNameDate}`;
    if (clientCode) {
        if (isWeek) {
            const { week, weekYear } = dateToWeek(dayDate);
            fileName = `${clientCode}_jadlospis_tygodnia_${week}_${weekYear}`;
        } else {
            fileName = `${clientCode}_${fileName}`;
        }
    }
    return fileName;

}

export default getFileName;