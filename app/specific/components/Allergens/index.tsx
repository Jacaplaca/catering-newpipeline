import getDictFromApi from '@root/app/lib/lang/getDictFromApi';
import getSettingsFromApi from '@root/app/lib/settings/getSettingsFromApi';
import MainComponent from '@root/app/specific/components/Allergens/MainComponent';
import { type FunctionComponent } from 'react';

const Allergens: FunctionComponent<{
    lang: LocaleApp,
    pageName: string,
}> = async ({ lang, pageName }) => {

    const [
        dictionary,
        mainSettings,
    ] = await Promise.all([
        getDictFromApi(lang, ["shared", "dashboard", "allergens"]),
        getSettingsFromApi('main'),
    ])

    return (
        <MainComponent
            lang={lang}
            pageName={pageName}
            dictionary={dictionary}
            settings={{
                main: mainSettings,
            }}
        />
    );
};

export default Allergens;