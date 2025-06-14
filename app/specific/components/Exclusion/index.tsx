import getDictFromApi from '@root/app/lib/lang/getDictFromApi';
import getSettingsFromApi from '@root/app/lib/settings/getSettingsFromApi';
import { type FunctionComponent } from 'react';
import ExclusionMainComponent from './MainComponent';
const Exclusion: FunctionComponent<{
    lang: LocaleApp,
    pageName: string,
}> = async ({ lang, pageName }) => {

    const [
        dictionary,
        mainSettings,
    ] = await Promise.all([
        getDictFromApi(lang, ["shared", "exclusion"]),
        getSettingsFromApi('main'),
    ])


    return (
        <div>
            <ExclusionMainComponent
                lang={lang}
                pageName={pageName}
                dictionary={dictionary}
                settings={{ main: mainSettings }}
            />
        </div>
    );
};

export default Exclusion;