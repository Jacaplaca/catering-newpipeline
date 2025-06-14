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
    ]

    return columns
}

export default useMealColumns