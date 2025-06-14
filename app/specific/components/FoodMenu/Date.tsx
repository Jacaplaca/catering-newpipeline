import DatePickerWithBlocked from '@root/app/specific/components/ui/DatePickerWithBlocked'
import { type FC } from 'react'
import { useFoodMenuContext } from './context';
const FoodMenuDate: FC = () => {
    const { day: { day, updateDay, cateringSettings }, lang } = useFoodMenuContext();
    const dateFormat = "EEEE, yyyy-MM-dd";
    return (
        <DatePickerWithBlocked
            lang={lang}
            day={day}
            cateringSettings={cateringSettings}
            // orderedDates={orderedDates}
            updateDay={updateDay}
            dateFormat={dateFormat}
            ignoreDeadlines={true}
        />
    )
}

export default FoodMenuDate;

