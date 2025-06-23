import translate from '@root/app/lib/lang/translate';
import { useConsumerDietsTableContext } from '@root/app/specific/components/FoodMenu/ConsumerDiets/context';

type Food = {
    id: string;
    name: string;
    ingredients: string | null;
}

const Info = ({ mealName, consumerName, food, exclusions, alternativeFood }:
    { mealName: string, consumerName: string, food: Food | null, exclusions: string[], alternativeFood: Food | null }) => {

    const isFoodReplaced = alternativeFood?.id ? alternativeFood.id !== food?.id : false;

    const { dictionary } = useConsumerDietsTableContext();
    return (
        <div className='space-y-1 rounded-md bg-neutral-50 p-3 dark:bg-neutral-900/50'>
            <p>
                <span className='font-semibold'>{translate(dictionary, 'menu-creator:meal_type')}: </span>
                {mealName}
            </p>
            <p>
                <span className='font-semibold'>{translate(dictionary, 'menu-creator:consumer')}: </span>
                {consumerName}
            </p>
            <p>
                <span className='font-semibold'>{translate(dictionary, 'menu-creator:original_food')}: </span>
                <span className={isFoodReplaced ? 'line-through ' : ''}>
                    {food?.name}
                </span>
                {exclusions.length > 0 &&
                    <span className='ml-2 text-sm italic text-neutral-500 dark:text-neutral-400'>
                        {exclusions.join(', ')}
                    </span>
                }
            </p>
            {isFoodReplaced && (
                <p>
                    <span className='font-semibold'>{translate(dictionary, 'menu-creator:alternative_food')}: </span>
                    {alternativeFood?.name}
                </p>
            )}
        </div>
    )
}

export default Info;