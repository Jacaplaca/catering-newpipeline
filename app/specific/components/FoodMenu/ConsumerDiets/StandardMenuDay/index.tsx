import Tooltip from '@root/app/_components/ui/Tooltip';
import translate from '@root/app/lib/lang/translate';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
import SelectedDisplay from '@root/app/specific/components/ui/Dropdown/SelectedDisplay';

const StandardMenuDay = () => {

    const { dictionary, getAllAllergensFromAllTypes, getFoodsByMealId, meals } = useFoodMenuContext();

    return (
        <div className="space-y-6">
            {/* Table-like layout */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                {/* Meal types row */}
                <div className="flex flex-wrap">
                    {meals?.map(({ name, id }) => {
                        const mealFoods = getFoodsByMealId(id);

                        return (
                            <div key={id} className="flex-1 min-w-[150px] border-r border-neutral-200 dark:border-neutral-700 last:border-r-0">
                                {/* Header */}
                                <div className="bg-neutral-50 dark:bg-neutral-800 p-2 border-b border-neutral-200 dark:border-neutral-600">
                                    <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{name}</h2>
                                </div>
                                {/* Cell content */}
                                <div className="p-4 bg-neutral-50 dark:bg-neutral-900">
                                    <div className="flex flex-wrap gap-2">
                                        {mealFoods.map((dish, index) => {
                                            if (!dish) return null;

                                            const tooltipContent = (
                                                <div className="space-y-2">
                                                    {dish.ingredients && (
                                                        <div>
                                                            <p className="font-semibold text-xs">{translate(dictionary, 'menu-creator:ingredients')}</p>
                                                            <p className="text-xs">{dish.ingredients}</p>
                                                        </div>
                                                    )}
                                                    {dish.allergens.length > 0 && (
                                                        <div>
                                                            <p className="font-semibold text-xs">{translate(dictionary, 'menu-creator:allergens')}</p>
                                                            <p className="text-xs">{dish.allergens.map(allergen => allergen.name).join(', ')}</p>
                                                        </div>
                                                    )}
                                                    {!dish.ingredients && dish.allergens.length === 0 && (
                                                        <p className="text-xs">{translate(dictionary, 'menu-creator:no-additional-information')}</p>
                                                    )}
                                                </div>
                                            );

                                            return (
                                                <Tooltip
                                                    key={dish.id}
                                                    content={tooltipContent}
                                                    placement="top"
                                                >
                                                    <span className="inline-block text-sm text-neutral-700 dark:text-neutral-300 cursor-help hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                                                        {dish.name}{index < mealFoods.length - 1 && ','}
                                                    </span>
                                                </Tooltip>
                                            );
                                        })}
                                        {mealFoods.length === 0 && (
                                            <span className="text-sm text-neutral-500 dark:text-neutral-400 italic">
                                                {translate(dictionary, 'menu-creator:no-dishes')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Allergens row spanning full width */}
                <div className="border-t bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700">
                    <div className="p-2">
                        <SelectedDisplay
                            selectedItems={getAllAllergensFromAllTypes()}
                            iconClassName="fas fa-exclamation-triangle"
                            label="Allergens:"
                            noBorder={true}
                            noBackground={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StandardMenuDay;