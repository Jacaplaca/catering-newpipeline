import { type ReactElement, type FC } from 'react';
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import '../DatePicker.css';
import DatePickerCustomHeader from '@root/app/_components/ui/Inputs/DatePickerCustomHeader';




type MonthPickerProps = {
    locale: LocaleApp;
    selected?: Date;
    minDate?: Date;
    CustomInput?: ReactElement;
    onSelect: (date: Date | null) => void;
    dateFormat?: string;
    filterDate?: (date: Date) => boolean;
    maxDate?: Date;
    dayClassName?: (date: Date) => string;
    disabled?: boolean;
}

const MonthPicker: FC<MonthPickerProps> = ({ locale, selected, minDate, CustomInput, onSelect, dateFormat = "MM/yyyy", filterDate, maxDate, disabled }) => {

    return (
        <div>
            <ReactDatePicker
                disabled={disabled}
                // monthClassName={(month) => { // This might need adjustment depending on the desired styling in month view
                //     const monthNumber = month.getMonth();
                //     return monthNumber === 0 || monthNumber === 11 ? 'bg-blue-500' : '';
                // }}
                locale={locale}
                customInput={CustomInput}
                selected={selected}
                minDate={minDate}
                filterDate={filterDate} // filterDate might behave differently with month view, check documentation if needed
                maxDate={maxDate}
                // onSelect={(a) => console.log(a)}
                onSelect={onSelect}
                dateFormat={dateFormat} // Default format set to MM/yyyy
                // dayClassName={dayClassName} // Likely not needed for month picker
                showMonthYearPicker // Added to enable month selection view


                renderCustomHeader={({ // Keep commented for now, might need adjustments for month view
                    date,
                    decreaseMonth, // This might become decreaseYear
                    increaseMonth, // This might become increaseYear
                    prevMonthButtonDisabled, // This might become prevYearButtonDisabled
                    nextMonthButtonDisabled, // This might become nextYearButtonDisabled
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

export default MonthPicker;