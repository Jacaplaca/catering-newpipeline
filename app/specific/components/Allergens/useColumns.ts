import { type TableColumnType } from '@root/types'
import { type AllergenSortName } from '@root/types/specific'

const useAllergenColumns = ({
    sort
}: {
    sort: (by: AllergenSortName) => void
}) => {

    const columns: TableColumnType[] = [
        {
            key: "name",
            title: 'allergens:name_column',
            sort: () => sort('name')
        },
    ]

    return columns
}

export default useAllergenColumns