import getDictFromApi from '@root/app/lib/lang/getDictFromApi';
import getSettingsFromApi from '@root/app/lib/settings/getSettingsFromApi';
import { type FunctionComponent } from 'react';
import FoodMainComponent from './MainComponent';
const Food: FunctionComponent<{
    lang: LocaleApp,
    pageName: string,
}> = async ({ lang, pageName }) => {

    const [
        dictionary,
        mainSettings,
    ] = await Promise.all([
        getDictFromApi(lang, ["shared", "food"]),
        getSettingsFromApi('main'),
    ])


    return (
        <div>
            <FoodMainComponent
                lang={lang}
                pageName={pageName}
                dictionary={dictionary}
                settings={{ main: mainSettings }}
            />
        </div>
    );
};

export default Food;