import translate from '@root/app/lib/lang/translate';
import { type ConsumerFoodItem } from '@root/app/server/api/routers/specific/libs/getGroupedConsumerFoodDataObject';

const ExclusionsList = ({ exclusions, dictionary }: { exclusions: Array<{ id?: string; name: string }>, dictionary: Record<string, string> }) => (
    <div className="mt-3">
        <p className="text-sm font-semibold  mb-2">
            <i className="fa-solid fa-ban mr-1"></i>
            {translate(dictionary, 'public-profile:exclusions')}:
        </p>
        <ul className="space-y-1">
            {exclusions.map((exclusion, idx) => (
                <li
                    key={exclusion.id ?? idx}
                    className="text-sm  flex items-center space-x-2"
                >
                    <i className="fa-solid fa-circle text-xs"></i>
                    <span>{exclusion.name}</span>
                </li>
            ))}
        </ul>
    </div>
);

const FoodItem = ({ consumerFood, dictionary }: { consumerFood: ConsumerFoodItem, dictionary: Record<string, string> }) => {
    const { food, comment, exclusions, isChanged } = consumerFood;

    return (
        <div
            className={`p-4 rounded-lg  space-y-4 ${isChanged
                ? 'bg-secondary/10 dark:bg-darkmode-secondary/10'
                : 'bg-form dark:bg-darkmode-form '
                }`}
        >

            <div className="flex flex-col gap-2 items-start mb-2">
                {isChanged && (
                    <span className="text-xs dark:text-darkmode-secondary font-medium self-end">
                        <i className="fa-solid fa-circle-exclamation mr-1"></i>
                        {translate(dictionary, 'public-profile:changed')}
                    </span>
                )}
                <h5 className="text-base font-semibold text-text dark:text-darkmode-text">
                    {food.name}
                </h5>
            </div>



            {food.ingredients && (
                <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-2">
                    <span className="font-medium">{translate(dictionary, 'public-profile:ingredients')}:</span> {food.ingredients}
                </p>
            )}

            {comment && (
                <div className="">
                    <p className="text-sm text-text dark:text-darkmode-text">
                        <i className="fa-solid fa-comment mr-1"></i>
                        <span className="font-semibold">{translate(dictionary, 'public-profile:comment')}:</span> {comment}
                    </p>
                </div>
            )}

            {exclusions && exclusions.length > 0 && <ExclusionsList exclusions={exclusions} dictionary={dictionary} />}
        </div>
    );
};

export default FoodItem;