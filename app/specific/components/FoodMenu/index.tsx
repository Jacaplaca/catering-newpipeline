import getDictFromApi from '@root/app/lib/lang/getDictFromApi';
import getSettingsFromApi from '@root/app/lib/settings/getSettingsFromApi';
import { type FunctionComponent } from 'react';
import FoodMenuComponent from './MainComponent';
const FoodMenu: FunctionComponent<{
    lang: LocaleApp,
    pageName: string,
}> = async ({ lang, pageName }) => {

    const [
        dictionary,
        mainSettings,
    ] = await Promise.all([
        getDictFromApi(lang, ["shared", "food", "clients", "menu-creator"]),
        getSettingsFromApi('main'),
    ])

    return (
        <div>
            <FoodMenuComponent
                lang={lang}
                pageName={pageName}
                dictionary={dictionary}
                settings={{ main: mainSettings }}
            />
        </div>
    );
};

export default FoodMenu;