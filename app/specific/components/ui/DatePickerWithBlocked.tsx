import { type FC, forwardRef } from "react";
import DatePicker from '@root/app/_components/ui/Inputs/DatePicker';
import { pl } from 'date-fns/locale/pl';
import { registerLocale } from 'react-datepicker';
import { format } from 'date-fns-tz';
import getDeadlinesStatus from '@root/app/specific/lib/getDeadlinesStatus';
import getCurrentTime from '@root/app/lib/date/getCurrentTime';
import { getBlockedDays } from '@root/app/specific/lib/dayInfo';

registerLocale('pl', pl);

const ExampleCustomInput = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void }>(
    ({ value, onClick }, ref) => (
        <button onClick={onClick} ref={ref}
            className={`flex flex-row gap-2 items-center px-2 sm:px-4 py-1 sm:py-2 rounded-md
            hover:bg-secondary hover:dark:bg-darkmode-secondary-accent
            text-gray-900 dark:text-gray-100
            `}
        >
            <i className="fa-solid fa-calendar-days" />
            <span className="whitespace-nowrap block text-base font-bold">{value}</span>
        </button>
    ),
);

ExampleCustomInput.displayName = 'ExampleCustomInput';

const DatePickerWithBlocked: FC<{
    lang: LocaleApp,
    day: {
        year: number,
        month: number,
        day: number,
    } | null,
    cateringSettings?: {
        firstOrderDeadline: string;
        secondOrderDeadline: string;
        allowWeekendOrder: boolean;
        timeZone: string;
        nonWorkingDays: string[];
    },
    orderedDates?: string[],
    updateDay: (day: { year: number, month: number, day: number }) => void,
    maxDate?: Date,
    dateFormat?: string,
    ignoreDeadlines?: boolean,
    onMonthChange?: (date: Date) => void,
    markedDays?: Date[],
}> = ({ lang, day, cateringSettings, orderedDates, updateDay, maxDate, dateFormat = "yyyy-MM-dd", ignoreDeadlines = false, onMonthChange, markedDays }) => {

    if (!day || !cateringSettings?.timeZone) return null;

    const dayDate = day && new Date(day.year, day.month, day.day);
    const dayDateString = format(dayDate, 'yyyy-MM-dd');

    const handleDateChange = (date: Date | null) => {
        if (date) {
            const year = date.getFullYear();
            const month = date.getMonth();
            const dayNum = date.getDate();
            updateDay({ year, month, day: dayNum });
        }
    };
    const minDate = getCurrentTime();
    // maxDate.setDate(maxDate.getDate() + 14);
    const blockedDays = getBlockedDays({ orderedDates, nonWorkingDaysCustom: cateringSettings?.nonWorkingDays ?? [] });


    const filterDate = (date: Date) => {
        const day = date.getDay();
        const dateString = format(date, 'yyyy-MM-dd');
        const today = getCurrentTime();
        today.setHours(0, 0, 0, 0); // reset time to start of day


        const unblocked = (
            day !== 0 && // not Sunday
            day !== 6 && // not Saturday
            !blockedDays.includes(dateString) &&
            date >= today // date is not earlier than today
        );

        if (unblocked) {
            const dayObj = { year: date.getFullYear(), month: date.getMonth(), day: date.getDate() };
            const status = cateringSettings && getDeadlinesStatus({ settings: cateringSettings, day: dayObj });
            return ignoreDeadlines ? true : Boolean(status?.isBeforeFirst);
        }

        return false;
    };
    console.log({ markedDays });
    return (
        <DatePicker
            locale={lang}
            dateFormat={dateFormat}
            minDate={minDate}
            selected={dayDateString}
            CustomInput={<ExampleCustomInput />}
            onSelect={handleDateChange}
            maxDate={maxDate}
            filterDate={filterDate}
            onMonthChange={onMonthChange}
            dayClassName={(date) => {
                const dateString = format(date, 'yyyy-MM-dd');
                return markedDays?.map(day => format(day, 'yyyy-MM-dd')).includes(dateString)
                    ? 'react-datepicker__day--marked'
                    : '';
            }}
        />
    );
};

export default DatePickerWithBlocked;
