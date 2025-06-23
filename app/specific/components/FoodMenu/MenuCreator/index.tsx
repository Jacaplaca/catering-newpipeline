import ConsumerDiets from '@root/app/specific/components/FoodMenu/ConsumerDiets';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
import MenuCreatorHeader from '@root/app/specific/components/FoodMenu/MenuCreator/Header';
import StandardMenuCreator from '@root/app/specific/components/FoodMenu/StandardMenuCreator';

const MenuCreator = () => {
    const { dictionary, lang, pageName, settings, showMenuForConsumers } = useFoodMenuContext();

    return (
        <div>
            <MenuCreatorHeader />
            {showMenuForConsumers ?
                <ConsumerDiets
                    lang={lang}
                    pageName={pageName}
                    dictionary={dictionary}
                    settings={settings}
                /> : <StandardMenuCreator />}
        </div>
    )
}

export default MenuCreator;
