import getDictFromApi from '@root/app/lib/lang/getDictFromApi';
import getSettingsFromApi from '@root/app/lib/settings/getSettingsFromApi';
import RoutesComponent from '@root/app/specific/components/Routes/RoutesComponent';
import { type FunctionComponent } from 'react';

const Routes: FunctionComponent<{
    lang: LocaleApp,
    pageName: string,
}> = async ({ lang, pageName }) => {

    const [
        dictionary,
        mainSettings,
    ] = await Promise.all([
        getDictFromApi(lang, ["shared", "dashboard", "routes"]),
        getSettingsFromApi('main'),
    ])

    return (
        <RoutesComponent
            lang={lang}
            pageName={pageName}
            dictionary={dictionary}
            settings={{
                main: mainSettings,
            }}
        />
    );
};

export default Routes;