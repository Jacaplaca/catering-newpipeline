import getDictFromApi from '@root/app/lib/lang/getDictFromApi';
import getSettingsFromApi from '@root/app/lib/settings/getSettingsFromApi';
import ClientsComponent from '@root/app/specific/components/Clients/Main/ClientsComponent';
import { type SettingParsedType } from '@root/types';
import { type FunctionComponent } from 'react';

const ClientsMain: FunctionComponent<{
    lang: LocaleApp,
    pageName: string,
    dictionary: Record<string, string>,
    settings: { main: SettingParsedType },
}> = ({ lang, pageName, dictionary, settings }) => {

    return (
        <div>
            <ClientsComponent
                lang={lang}
                pageName={pageName}
                dictionary={dictionary}
                settings={settings}
            />
        </div>
    );
};

export default ClientsMain;