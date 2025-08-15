import { type MealGroupsMap } from '@root/app/specific/components/Orders/ByDayMeals/groupMeals';
import { type TableColumnType } from '@root/types'
import { type OrdersGroupedByDaySortName } from '@root/types/specific'

const useOrderGroupedByDayColumns = ({
    sort,
    groupedMeals,
    // mealGroups
}: {
    sort: (by: OrdersGroupedByDaySortName) => void,
    groupedMeals: MealGroupsMap,
    // mealGroups: MealGroup[]
}) => {


    const groupedColumns: TableColumnType[] = Array.from(groupedMeals.values())
        .sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name))
        .map((group) => ({
            key: `group:${group.id}`,
            title: group.name,
            align: 'center',
            tooltip: group.meals.map((meal) => meal.name).join(', '),
            // sort: () => sort('deliveryDay'),
            // children: group.meals
            //     .slice()
            //     .sort((a, b) => a.name.localeCompare(b.name))
            //     .map((meal) => ({
            //         key: meal.id,
            //         title: meal.name,
            //         align: 'center' as const,
            //         // sort: () => sort('deliveryDay')
            //     }))
        }));

    // const standaloneColumns: TableColumnType[] = ungroupedMeals
    //     .slice()
    //     .sort((a, b) => a.name.localeCompare(b.name))
    //     .map((meal) => ({
    //         key: meal.id,
    //         title: meal.name,
    //         align: 'center' as const,
    //         sort: () => sort('deliveryDay')
    //     }));

    const columns: TableColumnType[] = [
        {
            key: 'deliveryDay',
            title: 'orders:delivery_day_column',
            sort: () => sort('deliveryDay'),
            align: 'center',
            // children: [
            //     {
            //         key: 'breakfast',
            //         title: '',
            //         align: 'center'
            //     },
            // ]
        },
        ...groupedColumns,
        {
            key: 'dayTools',
            title: '',
            align: 'center' as const,
            // children: [
            //     {
            //         key: 'pdf',
            //         title: '',
            //         align: 'center'
            //     },
            // ]
            // sort: () => sort('deliveryDay')
        },
    ]

    return columns
}

export default useOrderGroupedByDayColumns