import translate from '@root/app/lib/lang/translate';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
import FoodDropdown from '@root/app/specific/components/ui/Dropdown/Food';
import { type FC } from "react";

const Meal: FC<{
    name: string,
    id: string,
}> = ({ name, id }) => {
    const { dictionary, standardMenuForm, getAllergens, getFoodsByMealId } = useFoodMenuContext();
    const { updateMenu, updateFoodsOrder, isLoading } = standardMenuForm;
    return <div className={`gap-2 border  border-neutral-50 dark:border-neutral-800  rounded-md p-4 `}>

        <div className="font-semibold mb-2 text-lg">{name}</div>
        <FoodDropdown
            dictionary={dictionary}
            onItemsChange={(a) => { updateMenu(a as { id: string, name: string, ingredients: string | null, allergens: { id: string, name: string }[] }[], id) }}
            selectedItems={getFoodsByMealId(id)}
            inputClassName='w-full'
            foundLimitChars={80}
            placeholder={translate(dictionary, 'menu-creator:food_placeholder')}
            showSelectionIcon={true}
            allergens={getAllergens(id)}
            updateFoodsOrder={updateFoodsOrder}
            isFoodsLoading={isLoading}
            isSortable
        />
    </div>
}

export default Meal;
