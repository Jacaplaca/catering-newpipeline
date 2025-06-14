import { type TableColumnType } from '@root/types'
import { type RouteSortName } from '@root/types/specific'

const useRouteColumns = ({
    sort
}: {
    sort: (by: RouteSortName) => void
}) => {

    const columns: TableColumnType[] = [
        {
            key: "code",
            title: 'routes:code_column',
            sort: () => sort('code')
        },
        {
            key: "name",
            title: 'routes:name_column',
            sort: () => sort('name')
        },
        // {
        //     key: "description",
        //     title: 'routes:description_column',
        // }
    ]

    return columns
}

export default useRouteColumns