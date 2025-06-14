import { type TableColumnType } from '@root/types'
import { type FoodCategorySortName } from '@root/types/specific'

const useFoodCategoryColumns = ({
    sort
}: {
    sort: (by: FoodCategorySortName) => void
}) => {

    const columns: TableColumnType[] = [
        {
            key: "name",
            title: 'food:category_name_column',
            sort: () => sort('name')
        },
    ]

    return columns
}

export default useFoodCategoryColumns