import { type TableColumnType } from '@root/types'
import { type ClientCategorySortName } from '@root/types/specific'

const useClientCategoryColumns = ({
    sort
}: {
    sort: (by: ClientCategorySortName) => void
}) => {

    const columns: TableColumnType[] = [
        {
            key: "code",
            title: 'clients:category_code_column',
            sort: () => sort('code')
        },
        {
            key: "name",
            title: 'clients:category_name_column',
            sort: () => sort('name')
        },
    ]

    return columns
}

export default useClientCategoryColumns