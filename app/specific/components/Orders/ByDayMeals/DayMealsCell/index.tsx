import LabelsPdf from '@root/app/specific/components/Orders/ByDayMeals/DayMealsCell/LabelsPdf';
import OrderPdf from '@root/app/specific/components/Orders/ByDayMeals/DayMealsCell/Pdf';
import { type FC } from 'react';

const MealCount: FC<{ count: number }> = ({ count }) => {
    return <div className={`
    flex justify-center
    text-gray-900 dark:text-gray-100 font-bold text-base
    ${count ? "opacity-100" : "opacity-70"}
    `}>
        {count ? count : '-'}
    </div>
}

const DayMealsCell: FC<{ standard: number, diet: number, meal: string, dayId: string, hideCount?: boolean, hideReport?: boolean }> = ({ standard, diet, meal, dayId, hideCount, hideReport }) => {
    return <div className="flex justify-center">
        {!hideCount && <div className="flex gap-1 mr-4">
            <MealCount count={standard} />
            <div className="text-gray-900 dark:text-white text-base font-bold">/</div>
            <MealCount count={diet} />
        </div>}
        <div className="flex gap-2">
            {!hideReport && <OrderPdf meal={meal} dayId={dayId} />}
            <LabelsPdf meal={meal} dayId={dayId} />
        </div>
    </div>
}

export default DayMealsCell;