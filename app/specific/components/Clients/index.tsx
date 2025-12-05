import getDictFromApi from '@root/app/lib/lang/getDictFromApi';
import getSettingsFromApi from '@root/app/lib/settings/getSettingsFromApi';
import { type FunctionComponent } from 'react';
import ClientMainComponent from './MainComponent';

const Clients: FunctionComponent<{
    lang: LocaleApp,
    pageName: string,
}> = async ({ lang, pageName }) => {

    const [
        dictionary,
        mainSettings,
    ] = await Promise.all([
        getDictFromApi(lang, ["shared", "role", "invite", "dashboard", "clients"]),
        getSettingsFromApi('main'),
    ]);

    return (
        <div>
            <ClientMainComponent
                lang={lang}
                pageName={pageName}
                dictionary={dictionary}
                settings={{ main: mainSettings }}
            />
        </div>
    );
};

export default Clients;