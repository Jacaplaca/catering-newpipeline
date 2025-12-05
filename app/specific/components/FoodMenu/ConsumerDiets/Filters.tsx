import QuickFilterRow from '@root/app/_components/Table/QuickFilterRow'
import { Label } from '@root/app/_components/ui/label'
import translate from '@root/app/lib/lang/translate';
import { useConsumerDietsTableContext } from '@root/app/specific/components/FoodMenu/ConsumerDiets/context';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
import AllergenDropdown from '@root/app/specific/components/ui/Dropdown/Allergen';
import FoodDropdown from '@root/app/specific/components/ui/Dropdown/Food';

const FilterWrapper = ({ label, children }: { label: string, children: React.ReactNode }) => {
    return (
        <div className='flex flex-col gap-2 h-20'>
            <Label>{label}</Label>
            {children}
        </div>
    );
};

const ConsumerDietsFilters = () => {
    const {
        pageName,
        lang,
        dictionary,
        data: { table, skeleton },
        columns,
        isFetching,
        totalCount,
        search,
        sort: { sortName, sortDirection },
        filter: { allergens, addRemoveAllergen, clearAllergens, consumerAllergens, foodAllergens, foods, addRemoveConsumerAllergen, addRemoveFoodAllergen, addRemoveFood },
        fetchOneWithCommonAllergens
    } = useConsumerDietsTableContext();


    return (
        <div className='flex flex-row gap-4 p-4'>
            <FilterWrapper label={translate(dictionary, 'menu-creator:consumer_diets_filters_consumers_with_exclusions')}>
                <AllergenDropdown
                    dictionary={dictionary}
                    inputClassName='w-72'
                    foundLimitChars={35}
                    selectedItems={consumerAllergens}
                    onItemsChange={addRemoveConsumerAllergen}
                    showSelectionIcon
                    placeholder={translate(dictionary, 'food:allergens_placeholder')}
                    selectedLabel={translate(dictionary, 'food:selected_allergens')}
                    limitItems={1}
                // clearAll={clearAllergens}
                // clearAllLabel={translate(dictionary, 'food:clear_allergens')}
                />
            </FilterWrapper>
            <FilterWrapper label={translate(dictionary, 'menu-creator:consumer_diets_filters_foods_with_allergens')}>
                <AllergenDropdown
                    dictionary={dictionary}
                    inputClassName='w-72'
                    foundLimitChars={35}
                    selectedItems={foodAllergens}
                    onItemsChange={addRemoveFoodAllergen}
                    showSelectionIcon
                    placeholder={translate(dictionary, 'food:allergens_placeholder')}
                    selectedLabel={translate(dictionary, 'food:selected_allergens')}
                    limitItems={1}
                // clearAll={clearAllergens}
                // clearAllLabel={translate(dictionary, 'food:clear_allergens')}
                />
            </FilterWrapper>
            <FilterWrapper label={translate(dictionary, 'menu-creator:consumer_diets_filters_foods')}>
                <FoodDropdown
                    dictionary={dictionary}
                    // onItemsChange={(a) => { updateMenu(a as { id: string, name: string, ingredients: string | null, allergens: { id: string, name: string }[] }[], id) }}
                    onItemsChange={addRemoveFood}
                    selectedItems={foods}
                    inputClassName='w-full'
                    foundLimitChars={80}
                    placeholder={translate(dictionary, 'menu-creator:food_placeholder')}
                    showSelectionIcon={true}
                    limitItems={1}
                    hideInputWhenLimit={true}
                // allergens={getAllergens(id)}
                // updateFoodsOrder={updateFoodsOrder}
                // isFoodsLoading={isLoading}
                // isSortable
                />
            </FilterWrapper>
        </div>
    )
}

export default ConsumerDietsFilters;