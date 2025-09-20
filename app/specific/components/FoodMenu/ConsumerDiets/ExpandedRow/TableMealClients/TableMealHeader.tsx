import { useConsumerDietsTableContext } from '@root/app/specific/components/FoodMenu/ConsumerDiets/context';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
import translate from '@root/app/lib/lang/translate';
import { type MealWithDishes } from './index';
import Tooltip from '@root/app/_components/ui/Tooltip';
import useResetMealGroup from '@root/app/specific/components/FoodMenu/ConsumerDiets/ExpandedRow/useResetMeal';
import ConfirmationModal from '@root/app/_components/Modals/Confirmation';
import { useBoolean } from 'usehooks-ts';

const GetFromParentRegularMenuButton: React.FC<{ mealId: string | null }> = ({ mealId }) => {
    const { dictionary } = useConsumerDietsTableContext();
    const { value: isConfirmationOpen, setTrue: show, setFalse: hide } = useBoolean(false)
    const { resetMealGroup, isPending } = useResetMealGroup();
    const handleDeactivatePlace = () => {
        resetMealGroup(mealId ?? '');
    }
    return (
        <>
            <Tooltip content={translate(dictionary, 'menu-creator:get-from-parent-regular-menu')}>
                <button
                    onClick={() => {
                        show();
                    }}
                    className="inline-flex items-center justify-center w-6 h-6 rounded-md text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors duration-150 hover:shadow-sm"
                >
                    <i className={`fa-solid fa-arrow-rotate-left text-xs ${isPending ? 'animate-spin fas fa-spinner' : ''}`}></i>
                </button>
            </Tooltip>
            <ConfirmationModal
                question={translate(dictionary, 'menu-creator:are_you_sure_you_want_to_get_from_parent_regular_menu')}
                isModalOpen={isConfirmationOpen}
                hide={() => hide()}
                confirmAction={handleDeactivatePlace}
                dictionary={dictionary}
            />
        </>
    )
}

const TableMealHeader: React.FC<{ dishesByMeal: MealWithDishes[]; minColumnWidth: number }> = ({ dishesByMeal, minColumnWidth }) => {
    // console.log(dishesByMeal);

    const { dictionary } = useConsumerDietsTableContext();
    const { menuQueries, isMenuEditableForClient } = useFoodMenuContext();
    // const parentRegularMenuId = menuQueries?.existingMenu?.id;

    return (
        <div className="flex bg-neutral-100 dark:bg-neutral-700 border-b border-neutral-200 dark:border-neutral-600">
            <div className="w-[250px] flex-shrink-0 p-2 border-r border-neutral-200 dark:border-neutral-600">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {translate(dictionary, 'menu-creator:consumer')}
                </h3>
            </div>
            <div className="flex flex-1">
                {dishesByMeal.map(({ mealName, dishes, mealId }) => {
                    const columnCount = Math.max(1, dishes.length);
                    return (
                        <div
                            key={mealName}
                            className="border-r border-neutral-200 dark:border-neutral-600 last:border-r-0 text-center"
                            style={{
                                flex: columnCount,
                                minWidth: `${minColumnWidth * columnCount}px`
                            }}
                        >
                            <div className="p-2 flex items-center justify-center">
                                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                    {mealName}
                                </h3>
                                {isMenuEditableForClient && (
                                    <div className="ml-2">
                                        <GetFromParentRegularMenuButton mealId={mealId} />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    )
};

export default TableMealHeader;