import { type TableColumnType } from '@root/types'
import { type MealSortName } from '@root/types/specific'

const useMealColumns = ({
    sort
}: {
    sort: (by: MealSortName) => void
}) => {

    const columns: TableColumnType[] = [
        {
            key: "name",
            title: 'meals:name_column',
            sort: () => sort('name')
        },
        // {
        //     key: "mealCategory.name",
        //     title: 'meals:category_column',
        //     sort: () => sort('mealCategory.name')
        // },
        {
            key: "separateLabel",
            title: 'meals:separate_label_column',
        },
        {
            key: "mealGroup.name",
            title: 'meals:group_column',
            sort: () => sort('mealGroup.name')
        },
    ]

    return columns
}

export default useMealColumns