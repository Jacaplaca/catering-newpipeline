import type { NextPage } from 'next';
import PageLayout from '@root/app/partials/PageLayout';
import getDictFromApi from '@root/app/lib/lang/getDictFromApi';
import makeHref from '@root/app/lib/url/makeHref';
import Dashboard from '@root/app/_components/Dashboard';
import { api } from "app/trpc/server";
import getComponent from '@root/app/specific/lib/getComponent';
import translate from '@root/app/lib/lang/translate';
import { redirect } from 'next/navigation';
import ClientPickerWrapper from '@root/app/specific/components/ui/ClientPicker';

const pageName = 'dashboard';
const settingsKey = 'settings';
const getDashboard = async (lang: LocaleApp) => {
    try {
        return await api.navigation.getDashboard({ lang })
    } catch (error) {
        return [];
    }
};

const page: NextPage<{
    params: Promise<{
        lang: string
    }>;
    searchParams: Promise<Record<string, string>>;
}> = async (props) => {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const { key } = searchParams || {};
    const lang = params.lang as LocaleApp;
    const dashboard = await getDashboard(lang);

    const allowedItems = dashboard.reduce((acc, { items }) => {
        items.forEach(({ key }) => {
            acc[key] = true;
        })
        return acc;
    }, {} as Record<string, boolean>)

    const dictionary = await getDictFromApi(lang, ["dashboard", "shared"]);
    const hasFinishedSettings = await api.privateSettings.hasFinished()

    let redirectUrl = makeHref({ lang, page: pageName, params: new URLSearchParams({ ...searchParams, key: settingsKey }) });
    if (!key) {
        const firstItemKey = dashboard?.[0]?.items[0]?.key;
        if (firstItemKey && allowedItems[firstItemKey] && hasFinishedSettings) {
            redirectUrl = makeHref({ lang, page: pageName, params: new URLSearchParams({ ...searchParams, key: firstItemKey }) });
            redirect(redirectUrl);
        } else {
            redirect(redirectUrl);
        }
    }

    if (key && !hasFinishedSettings && key !== settingsKey) {
        redirect(redirectUrl);
    }

    const getComponentData = (key?: string) => {
        const Error = () => {
            return <div
                className="flex text-2xl font-bold "
            >{translate(dictionary, "wrong_item_message")}</div>
        }
        const errorTitle = translate(dictionary, "wrong_item_title");
        if (!key || !allowedItems[key]) {
            return {
                component: <Error />,
                title: errorTitle
            }
        }
        const { component, title } = getComponent({ key, lang, dictionary, searchParams }) as { component?: React.ReactElement, title?: string } || {};
        return {
            component: component ?? <Error />,
            title: title ?? errorTitle,
        }
    }

    const { component, title } = getComponentData(searchParams?.key);

    const seoData = {
        title,
        description: 'Admin page',
        url: makeHref({ lang, page: pageName }, true),
    }

    return (
        <PageLayout
            seoData={seoData}
            lang={lang}
            isLogged
            fullPage
        >
            <Dashboard
                menu={dashboard}
            // searchParams={searchParams}
            >
                <ClientPickerWrapper
                    lang={lang}
                    searchParams={searchParams}
                    pageName={pageName}
                    dictionary={dictionary}
                />
                {component}
            </Dashboard>

        </PageLayout>
    );

};

export default page;