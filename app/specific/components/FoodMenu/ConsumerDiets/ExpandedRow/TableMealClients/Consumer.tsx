import AllergenList from '@root/app/specific/components/FoodMenu/ConsumerDiets/ExpandedRow/AllergenList';
import MyButton from '@root/app/_components/ui/buttons/MyButton';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
import { useConsumerDietsTableContext } from '@root/app/specific/components/FoodMenu/ConsumerDiets/context';
import translate from '@root/app/lib/lang/translate';
import Tooltip from '@root/app/_components/ui/Tooltip';
import { env } from '@root/app/env';

export type MealTableConsumerType = { id: string; name: string; allergens: { id: string; name: string }[], notes?: string | undefined, code: string, diet: { code: string | null, description: string | null } };

const Consumer: React.FC<{
    consumer: MealTableConsumerType,
    hasAssignments: boolean,
    highlightedAllergenIds?: string[]
}> = ({ consumer, hasAssignments, highlightedAllergenIds }) => {
    const { createAssignments } = useFoodMenuContext();
    const { dictionary } = useConsumerDietsTableContext();

    return <div className="w-[250px] flex-shrink-0 p-3 border-r border-neutral-200 dark:border-neutral-600">
        <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {consumer.name}
                </span>
                <span className="text-xs text-neutral-700 dark:text-neutral-300">
                    ({consumer.code})
                </span>
            </div>
            {consumer.diet && (
                <div className="text-xs text-neutral-600 dark:text-neutral-300">
                    <span className="font-semibold">{consumer.diet.code}:</span> {consumer.diet.description ? consumer.diet.description : "---"}
                </div>
            )}
            {consumer.notes && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 italic mt-1">
                    {consumer.notes}
                </p>
            )}
            <AllergenList allergens={consumer.allergens} variant="consumer" highlightedIds={highlightedAllergenIds} />
            {!hasAssignments && (
                <div className="mt-3 pt-1 w-full flex justify-end">
                    <Tooltip
                        content={translate(dictionary, "menu-creator:add_meals_for_new_consumer_tooltip")}>
                        <MyButton
                            id={`add-meals-${consumer.id}`}
                            ariaLabel={translate(dictionary, "menu-creator:add_meals_for_new_consumer")}
                            onClick={() => createAssignments.createAutoAssignments(consumer.id)}
                            className="text-xs"
                            icon="fa-solid fa-plus"
                        >
                            {translate(dictionary, "menu-creator:add_meals_for_new_consumer")}
                        </MyButton>
                    </Tooltip>
                </div>
            )}
            {env.NEXT_PUBLIC_MENU_FRONT && (
                <div className="mt-3 pt-1 w-full flex justify-end">
                    {consumer.id}
                </div>
            )}
        </div>
    </div>;
}

export default Consumer;