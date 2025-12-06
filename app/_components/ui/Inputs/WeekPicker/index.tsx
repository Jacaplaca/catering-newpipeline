import { type ReactElement, type FC } from 'react';
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import '../DatePicker.css';
import DatePickerCustomHeader from '@root/app/_components/ui/Inputs/DatePickerCustomHeader';




type WeekPickerProps = {
    locale: LocaleApp;
    selected?: Date;
    minDate?: Date;
    CustomInput?: ReactElement;
    onSelect?: (date: Date | null) => void;
    dateFormat?: string;
    filterDate?: (date: Date) => boolean;
    maxDate?: Date;
    dayClassName?: (date: Date) => string;
    disabled?: boolean;
}

const WeekPicker: FC<WeekPickerProps> = ({ locale, selected, minDate, CustomInput, onSelect, dateFormat, filterDate, maxDate, dayClassName, disabled }) => {

    return (
        <div>
            <ReactDatePicker
                disabled={disabled}
                monthClassName={(month) => {
                    const monthNumber = month.getMonth();
                    return monthNumber === 0 || monthNumber === 11 ? 'bg-blue-500' : '';
                }}
                locale={locale}
                customInput={CustomInput}
                selected={selected}
                minDate={minDate}
                filterDate={filterDate}
                maxDate={maxDate}
                // onSelect={(a) => console.log(a)}
                onSelect={onSelect}
                dateFormat={dateFormat}
                dayClassName={dayClassName}
                showWeekPicker
                showWeekNumbers

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

export default WeekPicker;