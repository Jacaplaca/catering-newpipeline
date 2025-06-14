import { type FC, forwardRef } from "react";
import DatePicker from '@root/app/_components/ui/Inputs/DatePicker';
import { pl } from 'date-fns/locale/pl';
import { registerLocale } from 'react-datepicker';
import { useOrderTableContext } from '@root/app/specific/components/Orders/ByOrder/context';
import { format } from 'date-fns-tz';
import Deadline from '@root/app/specific/components/Orders/ByOrder/Order/Deadline';
import getDeadlinesStatus from '@root/app/specific/lib/getDeadlinesStatus';
import getCurrentTime from '@root/app/lib/date/getCurrentTime';
import { getNextWorkingDay } from '@root/app/specific/lib/dayInfo';
import DatePickerWithBlocked from '@root/app/specific/components/ui/DatePickerWithBlocked';

const OrderDatePicker: FC = () => {

    const {
        lang,
        order: {
            updateDay,
            day,
            orderedDates,
            settings: cateringSettings,
        }
    } = useOrderTableContext();

    return (
        <div className="flex flex-col md:flex-row gap-1 md:gap-4 justify-center items-center w-full pb-2 md:pb-4">
            {/* <label className="font-normal text-base">{translate(dictionary, 'orders:date_picker_label')}</label> */}
            <DatePickerWithBlocked
                lang={lang}
                day={day}
                cateringSettings={cateringSettings}
                orderedDates={orderedDates}
                updateDay={updateDay}
                maxDate={cateringSettings ? getNextWorkingDay(new Date(), cateringSettings) : undefined}
            />
            <Deadline />
        </div>
    );
};

export default OrderDatePicker;
