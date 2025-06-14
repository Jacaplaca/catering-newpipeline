import { type TableColumnType } from '@root/types'
import { type OrdersGroupedByDaySortName } from '@root/types/specific'

const useOrderGroupedByDayColumns = ({
    sort
}: {
    sort: (by: OrdersGroupedByDaySortName) => void
}) => {

    const columns: TableColumnType[] = [
        {
            key: "deliveryDay",
            title: 'orders:delivery_day_column',
            sort: () => sort('deliveryDay'),
            align: 'center'
        },
        {
            key: "breakfast",
            title: 'orders:breakfast_column',
            align: 'center'
        },
        {
            key: "lunch",
            title: 'orders:lunch_column',
            align: 'center'
        },
        {
            key: "dinner",
            title: 'orders:dinner_column',
            align: 'center'
        },
        // {
        //     key: "breakfastDietCount",
        //     title: 'orders:breakfastDiet_column',
        //     align: 'center'
        // },
        // {
        //     key: "lunchDietCount",
        //     title: 'orders:lunchDiet_column',
        //     align: 'center'
        // },
        // {
        //     key: "dinnerDietCount",
        //     title: 'orders:dinnerDiet_column',
        //     align: 'center'
        // },
        {
            key: "dayTools",
            title: '',
            align: 'center'
        },
        {
            key: "sentToCateringAt",
            title: 'orders:sentToCateringAt_column',
            align: 'center'
        },
    ]

    return columns
}

export default useOrderGroupedByDayColumns