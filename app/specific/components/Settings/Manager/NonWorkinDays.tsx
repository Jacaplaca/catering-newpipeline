import { type FunctionComponent } from 'react';
import DatePicker from '@root/app/_components/ui/Inputs/DatePicker';
import { format, addYears, getDay, isEqual, startOfDay, isAfter, parseISO } from 'date-fns';
import getCurrentTime from '@root/app/lib/date/getCurrentTime';
import { pl } from 'date-fns/locale/pl';
import { registerLocale } from 'react-datepicker';
import SelectedNonWorkingDaysList from './SelectedNonWorkingDaysList';
import translate from '@root/app/lib/lang/translate';
import { FormLabel } from '@root/app/_components/ui/form';

registerLocale('pl', pl);

const NonWorkinDays: FunctionComponent<{
    dictionary: Record<string, string>
    lang: LocaleApp
    nonWorkingDays: string[]
    setNonWorkingDays: (dates: string[]) => void
}> = ({ dictionary, lang, nonWorkingDays, setNonWorkingDays }) => {

    const minDate = getCurrentTime();
    const dayDate = new Date();
    const dayDateString = format(dayDate, 'yyyy-MM-dd');
    const maxDate = addYears(dayDate, 1);

    const handleDateSelect = (date: Date | null) => {
        if (!date) return;

        const day = getDay(date);
        if (day === 0 || day === 6) {
            return;
        }

        const selectedDateAtStartOfDay = startOfDay(date);
        const selectedDateString = format(selectedDateAtStartOfDay, 'yyyy-MM-dd');

        const isAlreadyBlocked = nonWorkingDays.some(blockedDateStr =>
            blockedDateStr === selectedDateString
        );

        let newBlockedDateStrings: string[];
        if (isAlreadyBlocked) {
            newBlockedDateStrings = nonWorkingDays.filter(blockedDateStr =>
                blockedDateStr !== selectedDateString
            );
        } else {
            newBlockedDateStrings = [...nonWorkingDays, selectedDateString].sort();
        }
        setNonWorkingDays(newBlockedDateStrings);
    };

    const filterDate = (date: Date): boolean => {
        const day = getDay(date);
        const isWeekend = day === 0 || day === 6; // Sunday or Saturday
        return !isWeekend;
    };

    const handleRemoveDate = (dateToRemove: Date) => {
        const dateToRemoveString = format(startOfDay(dateToRemove), 'yyyy-MM-dd');
        const newBlockedDates = nonWorkingDays.filter(
            blockedDateString => blockedDateString !== dateToRemoveString
        );
        setNonWorkingDays(newBlockedDates);
    };

    const handleRemoveMonth = (datesInMonthToRemove: Date[]) => {
        const datesToRemoveStrings = datesInMonthToRemove.map(d => format(startOfDay(d), 'yyyy-MM-dd'));
        const newBlockedDates = nonWorkingDays.filter(blockedDateString =>
            !datesToRemoveStrings.includes(blockedDateString)
        );
        setNonWorkingDays(newBlockedDates);
    };

    const today = startOfDay(new Date());

    const futureNonWorkingDaysAsDates: Date[] = nonWorkingDays
        .map(dateStr => startOfDay(parseISO(dateStr))) // Use parseISO for robust parsing of 'YYYY-MM-DD'
        .filter(dateObj => isAfter(dateObj, today))
        .sort((a, b) => a.getTime() - b.getTime());

    const groupedDates: Record<string, Date[]> = futureNonWorkingDaysAsDates.reduce((acc, dateObj) => {
        const monthYearKey = format(dateObj, 'LLLL yyyy', { locale: pl });
        if (!acc[monthYearKey]) {
            acc[monthYearKey] = [];
        }
        acc[monthYearKey].push(dateObj);
        return acc;
    }, {} as Record<string, Date[]>);


    return (
        <div className="flex flex-col sm:flex-row gap-8 items-start">
            <div>
                <div className='mb-2'>
                    <FormLabel>{translate(dictionary, 'settings:choose_non_working_days')}</FormLabel>
                </div>
                <DatePicker
                    locale={lang}
                    dateFormat="yyyy-MM-dd"
                    minDate={minDate}
                    selected={dayDateString}
                    onSelect={handleDateSelect}
                    alwaysOpen
                    maxDate={maxDate}
                    filterDate={filterDate}
                    dayClassName={(date) => {
                        const dateAtStartOfDay = startOfDay(date);
                        const dateString = format(dateAtStartOfDay, 'yyyy-MM-dd');
                        const dayOfWeek = getDay(dateAtStartOfDay);
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                        const isNonWorkingDay = nonWorkingDays.some(blockedDateStr =>
                            blockedDateStr === dateString
                        );

                        if (isWeekend || isNonWorkingDay) {
                            return 'non-working-day';
                        }
                        return '';
                    }}
                />
            </div>
            <SelectedNonWorkingDaysList
                groupedDates={groupedDates}
                dictionary={dictionary}
                onRemoveDate={handleRemoveDate}
                onRemoveMonth={handleRemoveMonth}
                locale={pl}
            />
        </div>
    )
}

export default NonWorkinDays;
