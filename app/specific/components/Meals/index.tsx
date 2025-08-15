import getDictFromApi from '@root/app/lib/lang/getDictFromApi';
import getSettingsFromApi from '@root/app/lib/settings/getSettingsFromApi';
import { type FunctionComponent } from 'react';
import MealMainComponent from './MainComponent';
const Food: FunctionComponent<{
    lang: LocaleApp,
    pageName: string,
}> = async ({ lang, pageName }) => {

    const [
        dictionary,
        mainSettings,
    ] = await Promise.all([
        getDictFromApi(lang, ["shared", "dashboard", "meals"]),
        getSettingsFromApi('main'),
    ])


    return (
        <div>
            <MealMainComponent
                lang={lang}
                pageName={pageName}
                dictionary={dictionary}
                settings={{ main: mainSettings }}
            />
        </div>
    );
};

export default Food;