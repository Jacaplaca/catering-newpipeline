import { type FC } from "react";
import { useOrderTableContext } from '@root/app/specific/components/Orders/ByOrder/context';
import Deadline from '@root/app/specific/components/Orders/ByOrder/Order/Deadline';
import { getBlockedDays, getNextWorkingDay } from '@root/app/specific/lib/dayInfo';
import DatePickerWithBlocked from '@root/app/specific/components/ui/DatePickerWithBlocked';
import getCurrentTime from '@root/app/lib/date/getCurrentTime';

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
                updateDay={updateDay}
                maxDate={cateringSettings ? getNextWorkingDay(new Date(), cateringSettings) : undefined}
                minDate={getCurrentTime()}
                blockedDays={getBlockedDays({ orderedDates, nonWorkingDaysCustom: cateringSettings?.nonWorkingDays ?? [] })}
                blockPreviousDays={true}
            />
            <Deadline />
        </div>
    );
};

export default OrderDatePicker;
