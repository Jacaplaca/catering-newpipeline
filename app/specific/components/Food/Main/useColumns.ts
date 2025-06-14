import { type TableColumnType } from '@root/types'
import { type FoodSortName } from '@root/types/specific'

const useFoodColumns = ({
    sort
}: {
    sort: (by: FoodSortName) => void
}) => {

    const columns: TableColumnType[] = [
        {
            key: "name",
            title: 'food:name_column',
            sort: () => sort('name')
        },
        {
            key: "allergens",
            title: 'food:allergens_column',
        },
        {
            key: "foodCategory.name",
            title: 'food:food_category_column',
            sort: () => sort('foodCategory.name')
        },
        {
            key: "ingredients",
            title: 'food:ingredients_column',
        },
    ]

    return columns
}

export default useFoodColumns