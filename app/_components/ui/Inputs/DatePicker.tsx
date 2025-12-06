import { type FC, type ReactElement } from 'react';
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import './DatePicker.css';
import DatePickerCustomHeader from '@root/app/_components/ui/Inputs/DatePickerCustomHeader';

type DatePickerProps = {
    locale: LocaleApp;
    selected: string;
    minDate?: Date;
    CustomInput?: ReactElement;
    onSelect: (date: Date | null) => void;
    dateFormat?: string;
    filterDate?: (date: Date) => boolean;
    maxDate?: Date;
    dayClassName?: (date: Date) => string;
    alwaysOpen?: boolean;
    onMonthChange?: (date: Date) => void;
}

const DatePicker: FC<DatePickerProps> = ({ locale, selected, minDate, CustomInput, onSelect, dateFormat, filterDate, maxDate, dayClassName, alwaysOpen = false, onMonthChange }) => {

    return (
        <div>
            <ReactDatePicker
                monthClassName={(month) => {
                    const monthNumber = month.getMonth();
                    return monthNumber === 0 || monthNumber === 11 ? 'bg-blue-500' : '';
                }}
                locale={locale}
                customInput={CustomInput}
                selected={new Date(selected)}
                minDate={minDate}
                filterDate={filterDate}
                maxDate={maxDate}
                onSelect={onSelect}
                dateFormat={dateFormat}
                dayClassName={dayClassName}
                inline={alwaysOpen}
                onMonthChange={onMonthChange}
                renderCustomHeader={({
                    date,
                    decreaseMonth,
                    increaseMonth,
                    prevMonthButtonDisabled,
                    nextMonthButtonDisabled,
                }) => (
                    <DatePickerCustomHeader
                        locale={locale}
                        date={date}
                        decreaseMonth={decreaseMonth}
                        increaseMonth={increaseMonth}
                        prevMonthButtonDisabled={prevMonthButtonDisabled}
                        nextMonthButtonDisabled={nextMonthButtonDisabled}
                    />
                )}
            />
        </div>
    );
}

export default DatePicker;