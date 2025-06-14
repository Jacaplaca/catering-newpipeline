import { type TableColumnType } from '@root/types'
import { type ClientsSortName } from '@root/types/specific'

const useClientColumns = ({
    sort
}: {
    sort: (by: ClientsSortName) => void
}) => {

    const columns: TableColumnType[] = [
        {
            key: "info.code",
            title: 'clients:info.code_column',
            sort: () => sort('code')
        },
        {
            key: "info.name",
            title: 'clients:info.name_column',
            sort: () => sort('info.name')
        },
        {
            key: "name",
            title: 'clients:name_column',
            sort: () => sort('name')
        },
        {
            key: "email",
            title: 'clients:email_column',
            sort: () => sort('email')
        },
        {
            key: "info.email",
            title: 'clients:info.email_column',
            sort: () => sort('info.email')
        },
        {
            key: "info.phone",
            title: 'clients:info.phone_column',
            sort: () => sort('info.phone')
        },
        {
            key: "info.address",
            title: 'clients:info.address_column',
            sort: () => sort('info.address')
        },
        {
            key: "info.city",
            title: 'clients:info.city_column',
            sort: () => sort('info.city')
        },
        {
            key: "info.zip",
            title: 'clients:info.zip_code_column',
            sort: () => sort('info.zip')
        },
        {
            key: "info.contactPerson",
            title: 'clients:info.contact_person_column',
            sort: () => sort('info.contactPerson')
        },
        {
            key: "info.country",
            title: 'clients:info.country_column',
            sort: () => sort('info.country')
        },
        {
            key: "deliveryRoute.code",
            title: 'clients:route_column',
            sort: () => sort('deliveryRoute.code')
        },
        {
            key: "info.firstOrderDeadline",
            title: 'clients:info.firstOrderDeadline_column',
        },
        {
            key: "info.secondOrderDeadline",
            title: 'clients:info.secondOrderDeadline_column',
        },
        {
            key: "info.allowWeekendOrder",
            title: 'clients:info.allowWeekendOrder_column',
        },
        // {
        //     key: "settings.lastOrderTime",
        //     title: 'clients:settings.lastOrderTime_column',
        //     sort: () => sort('settings.lastOrderTime')
        // }
    ]

    return columns
}

export default useClientColumns