import { useState } from 'react';
import { type ClientFoodAssignment } from '@root/types/specific';
import FoodReplacementEditor from '@root/app/specific/components/FoodMenu/ConsumerDiets/ExpandedRow/FoodReplacementEditor';
import getCommonAllergens from '@root/app/specific/components/FoodMenu/ConsumerDiets/ExpandedRow/getCommonAllergens';
import AutoReplaceButton from './AutoReplaceButton';
import ResetButton from '@root/app/specific/components/FoodMenu/ConsumerDiets/ExpandedRow/ResetButton';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';

interface ConsumerDishCellProps {
    assignment: ClientFoodAssignment
}

const ConsumerDishCell = ({ assignment }: ConsumerDishCellProps) => {
    const { consumer, food, exclusions, mealId } = assignment;
    const [isConsumerDietEditorOpen, setConsumerDietEditorOpen] = useState(false);
    const { getFoodsByMealId } = useFoodMenuContext();
    console.log("standardMenuForm", getFoodsByMealId(mealId));

    const exclusionAllergens = exclusions.flatMap(ex =>
        ex.exclusion.allergens.map(a => ({ id: a.allergen.id, name: a.allergen.name }))
    );

    const commonAllergens = getCommonAllergens(
        consumer.allergens.map(a => ({ id: a.allergen.id, name: a.allergen.name })),
        food.allergens.map(a => ({ id: a.allergen.id, name: a.allergen.name })),
        exclusionAllergens,
    );

    const hasAllergenWarning = commonAllergens.length > 0;
    const hasExclusions = exclusions.length > 0;
    const exclusionNames = exclusions.map(e => e.exclusion.name).join(', ');

    const handleOpen = () => {
        !isConsumerDietEditorOpen && setConsumerDietEditorOpen(true);
    };

    const showResetButton = () => {
        const sameFoods = getFoodsByMealId(mealId).some(f => f.id === food.id);
        const noExclusions = exclusions.length === 0;
        const noComment = !assignment.comment;
        return !sameFoods || !noExclusions || !noComment;
    }

    return (
        <div
            className={`w-full h-full text-center cursor-pointer flex flex-col ${hasAllergenWarning
                ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                : 'bg-emerald-50 dark:bg-emerald-800/20 hover:bg-emerald-200 dark:hover:bg-emerald-800/30'
                }`}
            title={hasAllergenWarning ? `Allergen warning: ${commonAllergens.map(a => a.name).join(', ')}` : (hasExclusions ? `Exclusions: ${exclusionNames}` : food.name)}
            onClick={handleOpen}
        >
            {/* Top section - buttons and warning icon */}
            <div className="flex justify-between items-center p-1 min-h-[2rem]">
                <div className="flex gap-1">
                    {showResetButton() && <ResetButton assignmentId={assignment.id} />}
                    {hasAllergenWarning && (
                        <AutoReplaceButton assignmentId={assignment.id} />
                    )}
                </div>
                <div>
                    {hasAllergenWarning && (
                        <i className="fa-solid fa-triangle-exclamation text-red-500 dark:text-red-400"></i>
                    )}
                </div>
            </div>

            {/* Middle section - food name and exclusions */}
            <div className="flex-1 flex flex-col items-center justify-start px-3 py-2">
                <span className="font-semibold text-neutral-900 dark:text-neutral-50">{food.name}</span>
                {hasExclusions && (
                    <span className='mt-1 text-xs italic text-neutral-500 dark:text-neutral-400'>
                        {exclusionNames}
                    </span>
                )}
            </div>

            {/* Bottom section - common allergens */}
            {hasAllergenWarning && (
                <div className="bg-red-100 dark:bg-red-900/40 border-t border-red-200 dark:border-red-800 px-1 py-0.5">
                    <span className="text-xs text-red-700 dark:text-red-300 font-medium">
                        {commonAllergens.map(allergen => allergen.name).join(', ')}
                    </span>
                </div>
            )}

            <FoodReplacementEditor
                isOpen={isConsumerDietEditorOpen}
                onClose={() => setConsumerDietEditorOpen(false)}
                assignment={assignment}
            />
        </div>
    );
};

export default ConsumerDishCell; 