import DatePickerWithBlocked from '@root/app/specific/components/ui/DatePickerWithBlocked'
import { type FC } from 'react'
import { useFoodMenuContext } from './context';
import useConfiguredDays from '@root/app/specific/components/FoodMenu/useConfiguredDays';
const FoodMenuDate: FC = () => {
    const { day: { day, updateDay, cateringSettings }, lang } = useFoodMenuContext();
    const { onMonthChange, pickedMonth, configuredDays } = useConfiguredDays();
    const dateFormat = "EEEE, yyyy-MM-dd";
    console.log({ pickedMonth });
    return (
        <DatePickerWithBlocked
            lang={lang}
            day={day}
            cateringSettings={cateringSettings}
            // orderedDates={orderedDates}
            updateDay={updateDay}
            dateFormat={dateFormat}
            ignoreDeadlines={true}
            onMonthChange={onMonthChange}
            markedDays={configuredDays?.map(({ year, month, day }) => new Date(year, month, day))}
        />
    )
}

export default FoodMenuDate;

