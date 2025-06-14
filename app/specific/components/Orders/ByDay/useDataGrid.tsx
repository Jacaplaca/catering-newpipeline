import HighlightText from '@root/app/_components/Table/HighlightText';
import SkeletonCell from '@root/app/_components/Table/SkeletonCell';
import DayMealsCell from '@root/app/specific/components/Orders/ByDay/DayMealsCell';
import DayTools from '@root/app/specific/components/Orders/ByDay/DayTools';
import { MealType, type OrderGroupedByDayCustomTable } from '@root/types/specific';
import { format } from 'date-fns-tz';
// import { type FC } from 'react';

// const MealCount: FC<{ count: number }> = ({ count }) => {
//     return <div className={`
//     flex justify-center
//     text-gray-900 dark:text-gray-100 font-bold text-base
//     ${count ? "opacity-100" : "opacity-70"}
//     `}>
//         {count ? count : '-'}
//     </div>
// }

const useOrderGroupedByDayDataGrid = ({
    rows,
    limit,
    totalCount,
    columns,
}: {
    rows: OrderGroupedByDayCustomTable[]
    limit: number,
    totalCount: number,
    columns: { key: string }[],
}) => {

    const skeletonRowsCount = limit > totalCount ? totalCount : limit
    const skeleton = Array.from({ length: skeletonRowsCount }, (_, i) => {
        return {
            key: `skeleton-${i}`,
            rows: columns.map(({ key }) => {
                return {
                    component: <SkeletonCell />,
                    key
                }
            })
        }
    })

    const table = rows.map(({ id, deliveryDay, breakfastStandard,
        lunchStandard, dinnerStandard, breakfastDietCount, lunchDietCount, dinnerDietCount, sentToCateringAt }, i) => {
        const deliveryDayDate = new Date(deliveryDay?.year ?? 0,
            deliveryDay?.month ?? 0,
            deliveryDay?.day ?? 0);
        return {
            key: id ?? `placeholderData-${i}`,
            rows: [
                {
                    component: <HighlightText
                        className="whitespace-nowrap font-medium text-gray-900 dark:text-white flex justify-center"
                        text={deliveryDayDate ? format(deliveryDayDate, 'dd-MM-yyyy') : ''}
                    />,
                    key: 'deliveryDay'
                },
                {
                    component: <DayMealsCell
                        standard={breakfastStandard}
                        diet={breakfastDietCount}
                        meal={MealType.Breakfast}
                        dayId={id}
                    />,
                    key: 'breakfast'
                },
                {
                    component: <DayMealsCell
                        standard={lunchStandard}
                        diet={lunchDietCount}
                        meal={MealType.Lunch}
                        dayId={id}
                    />,
                    key: 'lunch'
                },
                {
                    component: <DayMealsCell
                        standard={dinnerStandard}
                        diet={dinnerDietCount}
                        meal={MealType.Dinner}
                        dayId={id}
                    />,
                    key: 'dinner'
                },
                // {
                //     component: <MealCount count={breakfastDietCount} />,
                //     key: 'breakfastDietCount'
                // },
                // {
                //     component: <MealCount count={lunchDietCount} />,
                //     key: 'lunchDietCount'
                // },
                // {
                //     component: <MealCount count={dinnerDietCount} />,
                //     key: 'dinnerDietCount'
                // },
                {
                    component: <DayTools dayId={id} />,
                    key: 'dayTools'
                },
                {
                    component: <HighlightText
                        className="whitespace-nowrap font-medium text-gray-900 dark:text-white flex justify-center"
                        text={sentToCateringAt?.$date ? format(sentToCateringAt.$date, 'dd-MM-yyyy HH:mm') : ''}
                    />,
                    key: 'sentToCateringAt'
                },
            ]
        }
    });

    return { skeleton, table }

}

export default useOrderGroupedByDayDataGrid;