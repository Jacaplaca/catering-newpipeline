import Users from '@root/app/specific/components/Users'
import translate from '@root/app/lib/lang/translate'
import Settings from '@root/app/specific/components/Settings'
import Clients from '@root/app/specific/components/Clients'
import Dieticians from '@root/app/specific/components/Dieticians'
import Kitchens from '@root/app/specific/components/Kitchens'
import Consumers from '@root/app/specific/components/Consumers'
import Orders from '@root/app/specific/components/Orders'
import ClientFiles from '@root/app/specific/components/ClientFiles'
import Routes from '@root/app/specific/components/Routes'
import Allergens from '@root/app/specific/components/Allergens'
import Food from '@root/app/specific/components/Food'
import FoodMenu from '@root/app/specific/components/FoodMenu'
import Exclusion from '@root/app/specific/components/Exclusion'
import Meals from '@root/app/specific/components/Meals'
import Documents from '@root/app/specific/components/PublicData/Client/Documents'
import ActivityLog from '@root/app/specific/components/ActivityLog'
import { type ReactElement } from 'react'

const getComponent = ({
    key,
    lang,
    dictionary,
    searchParams,
}: {
    key: string
    lang: LocaleApp
    dictionary: Record<string, string>
    searchParams: Record<string, string>,
}) => {
    const pageName = 'dashboard';
    const components = {
        'accounts': {
            title: translate(dictionary, 'dashboard:item-users-title'),
            component: <Users lang={lang} pageName={pageName} />,
        },
        'settings': {
            title: translate(dictionary, 'dashboard:item-settings-title'),
            component: <Settings
                lang={lang}
                pageName={pageName}
                dictionary={dictionary}
                clientId={searchParams?.clientId}
            />,
        },
        'clients': {
            title: translate(dictionary, 'dashboard:item-clients-title'),
            component: <Clients lang={lang} pageName={pageName} />,
        },
        'dieticians': {
            title: translate(dictionary, 'dashboard:item-dieticians-title'),
            component: <Dieticians lang={lang} pageName={pageName} />,
        },
        'kitchens': {
            title: translate(dictionary, 'dashboard:item-kitchens-title'),
            component: <Kitchens lang={lang} pageName={pageName} />,
        },
        'consumers': {
            title: translate(dictionary, 'dashboard:item-consumers-title'),
            component: <Consumers lang={lang}
                pageName={pageName}
                clientId={searchParams?.clientId}
            />,
        },
        'orders': {
            title: translate(dictionary, 'dashboard:item-orders-title'),
            component: <Orders
                lang={lang}
                pageName={pageName}
                clientId={searchParams?.clientId}
            />,
        },
        'client-files': {
            title: translate(dictionary, 'dashboard:item-client-files-title'),
            component: <ClientFiles lang={lang} pageName={pageName} />,
        },
        'routes': {
            title: translate(dictionary, 'dashboard:item-routes-title'),
            component: <Routes lang={lang} pageName={pageName} />,
        },
        'documents': {
            title: translate(dictionary, 'dashboard:item-documents-title'),
            component: <Documents lang={lang} pageName={pageName} clientId={searchParams?.clientId} />,
        },
        'allergens': {
            title: translate(dictionary, 'dashboard:item-allergens-title'),
            component: <Allergens lang={lang} pageName={pageName} />,
        },
        'food': {
            title: translate(dictionary, 'dashboard:item-food-title'),
            component: <Food lang={lang} pageName={pageName} />,
        },
        'food-menu': {
            title: translate(dictionary, 'dashboard:item-food-menu-title'),
            component: <FoodMenu lang={lang} pageName={pageName} />,
        },
        "exclusions": {
            title: translate(dictionary, 'dashboard:item-exclusions-title'),
            component: <Exclusion lang={lang} pageName={pageName} />,
        },
        "meals": {
            title: translate(dictionary, 'dashboard:item-meals-title'),
            component: <Meals lang={lang} pageName={pageName} />,
        },
        "activity-log": {
            title: translate(dictionary, 'dashboard:item-activity-log-title'),
            component: <ActivityLog lang={lang} pageName={pageName} />,
        },
    } as Record<string, { title: string, component: ReactElement }>

    return { ...components[key] };
}

export default getComponent;