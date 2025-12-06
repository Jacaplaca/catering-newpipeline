import HighlightText from '@root/app/_components/Table/HighlightText';
import SkeletonCell from '@root/app/_components/Table/SkeletonCell';
import DayMealsCell from '@root/app/specific/components/Orders/ByDayMeals/DayMealsCell';
import DayTools from '@root/app/specific/components/Orders/ByDayMeals/DayTools';
import { type MealGroupsMap } from '@root/app/specific/components/Orders/ByDayMeals/groupMeals';
import { type MealType, type OrderGroupedByDayCustomTable } from '@root/types/specific';
import { mealGroup2orderField } from '@root/app/assets/maps/catering';
import { format } from 'date-fns-tz';
import { type ReactElement } from 'react';
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
    groupedMeals,
}: {
    rows: OrderGroupedByDayCustomTable[]
    limit: number,
    totalCount: number,
    columns: { key: string }[],
    groupedMeals: MealGroupsMap
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


    const table = rows.map((row, i) => {

        const { id: dayId, deliveryDay } = row;

        const mealsTable: {
            component: ReactElement,
            key: string
        }[] = [];

        Array.from(groupedMeals.values())
            .sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name))
            .forEach((group) => ({
                children: group.meals
                    .slice()
                    .filter(({ mealGroupId }) => mealGroupId)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .forEach(({ mealGroupId, id }, index) => {
                        const isFirst = index === 0;
                        const field = mealGroup2orderField[mealGroupId as MealType]
                        isFirst && mealsTable.push({
                            component: <DayMealsCell
                                standard={row[field.standard as keyof typeof row] as number}
                                diet={row[field.diet as keyof typeof row] as number}
                                meal={id}
                                dayId={dayId}
                                hideCount={!isFirst}
                                hideReport={!isFirst}
                            />,
                            key: id
                        })
                    })
            }));


        const deliveryDayDate = new Date(deliveryDay?.year ?? 0,
            deliveryDay?.month ?? 0,
            deliveryDay?.day ?? 0);
        return {
            key: dayId ?? `placeholderData-${i}`,
            rows: [
                {
                    component: <HighlightText
                        className="whitespace-nowrap font-medium text-gray-900 dark:text-white flex justify-center"
                        text={deliveryDayDate ? format(deliveryDayDate, 'dd-MM-yyyy') : ''}
                    />,
                    key: 'deliveryDay'
                },
                ...mealsTable,
                // {
                //     component: <DayMealsCell
                //         standard={breakfastStandard}
                //         diet={breakfastDietCount}
                //         meal={MealType.Breakfast}
                //         dayId={id}
                //     />,
                //     key: 'breakfast'
                // },
                // {
                //     component: <DayMealsCell
                //         standard={lunchStandard}
                //         diet={lunchDietCount}
                //         meal={MealType.Lunch}
                //         dayId={id}
                //     />,
                //     key: 'lunch'
                // },
                // {
                //     component: <DayMealsCell
                //         standard={dinnerStandard}
                //         diet={dinnerDietCount}
                //         meal={MealType.Dinner}
                //         dayId={id}
                //     />,
                //     key: 'dinner'
                // },
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
                    component: <DayTools dayId={dayId} />,
                    key: 'dayTools'
                },
                // {
                //     component: <HighlightText
                //         className="whitespace-nowrap font-medium text-gray-900 dark:text-white flex justify-center"
                //         text={sentToCateringAt?.$date ? format(sentToCateringAt.$date, 'dd-MM-yyyy HH:mm') : ''}
                //     />,
                //     key: 'sentToCateringAt'
                // },
            ]
        }
    });

    return { skeleton, table }

}

export default useOrderGroupedByDayDataGrid;