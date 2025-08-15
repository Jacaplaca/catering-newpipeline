import { type TableColumnType } from '@root/types'
import { type MealCategorySortName } from '@root/types/specific'

const useMealCategoryColumns = ({
    sort
}: {
    sort: (by: MealCategorySortName) => void
}) => {

    const columns: TableColumnType[] = [
        {
            key: "name",
            title: 'meals:category_name_column',
            sort: () => sort('name')
        },
    ]

    return columns
}

export default useMealCategoryColumns