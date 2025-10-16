import { type TableColumnType } from '@root/types'
import { type ConsumersSortName } from '@root/types/specific'

const useConsumerColumns = ({
    sort
}: {
    sort: (by: ConsumersSortName) => void
}) => {

    const columns: TableColumnType[] = [
        {
            key: "code",
            title: 'consumers:code_column',
            sort: () => sort('code')
        },
        {
            key: "name",
            title: 'consumers:name_column',
            sort: () => sort('name')
        },
        {
            key: "diet.code",
            title: 'consumers:diet.code_column',
            sort: () => sort('diet.code')
        },
        {
            key: "diet.description",
            title: 'consumers:diet.description_column',
            sort: () => sort('diet.description')
        },
        {
            key: "dietician.name",
            title: 'consumers:diet.dietician_name_column',
            sort: () => sort('diet.dietician.name')
        },
        {
            key: "client.name",
            title: 'consumers:client.name_column',
            sort: () => sort('client.name')
        },
        {
            key: "client.code",
            title: 'consumers:client.code_column',
            sort: () => sort('client.code')
        },
        {
            key: "linkCopy",
            title: '',
        },
        {
            key: "createdAt",
            title: 'consumers:createdAt_column',
            sort: () => sort('createdAt')
        }
    ]

    return columns
}

export default useConsumerColumns