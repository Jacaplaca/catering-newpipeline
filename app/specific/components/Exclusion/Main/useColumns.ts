import { type TableColumnType } from '@root/types'
import { type ExclusionSortName } from '@root/types/specific'

const useExclusionColumns = ({
    sort
}: {
    sort: (by: ExclusionSortName) => void
}) => {

    const columns: TableColumnType[] = [
        {
            key: "name",
            title: 'exclusion:name_column',
            sort: () => sort('name')
        },
        {
            key: "allergens",
            title: 'exclusion:allergens_column',
        },
    ]

    return columns
}

export default useExclusionColumns