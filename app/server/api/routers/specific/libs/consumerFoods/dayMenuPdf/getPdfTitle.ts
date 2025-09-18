import translate from '@root/app/lib/lang/translate';
import dateToWeek from '@root/app/specific/lib/dateToWeek';
import { format } from 'date-fns-tz';
import { pl } from 'date-fns/locale';

const getPdfTitle = ({ dayDate, clientCode, isWeek, dictionary }: { dayDate: Date, clientCode?: string | null, isWeek: boolean, dictionary: Record<string, string> }): string => {
    const headDate = format(dayDate, "EEEE d MMM yyyy ", { locale: pl });
    let pdfTitle = translate(dictionary, 'menu-creator:pdf-title', [headDate]);
    if (clientCode) {
        if (isWeek) {
            const { week, weekYear } = dateToWeek(dayDate);
            pdfTitle = translate(dictionary, 'menu-creator:pdf-title-for-week', [`${week}/${weekYear}`, clientCode]);
        } else {
            pdfTitle = translate(dictionary, 'menu-creator:pdf-title-for-client', [headDate, clientCode ?? '']);
        }
    }
    return pdfTitle;
}

export default getPdfTitle;