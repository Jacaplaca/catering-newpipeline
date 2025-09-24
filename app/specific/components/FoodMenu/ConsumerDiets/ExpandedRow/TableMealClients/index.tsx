import { env } from '@root/app/env';
import translate from '@root/app/lib/lang/translate';
import { useConsumerDietsTableContext } from '@root/app/specific/components/FoodMenu/ConsumerDiets/context';
import AllergenList from '@root/app/specific/components/FoodMenu/ConsumerDiets/ExpandedRow/AllergenList';
import ConsumerDishCell from '@root/app/specific/components/FoodMenu/ConsumerDiets/ExpandedRow/ConsumerDishCell';
import Consumer, { type MealTableConsumerType } from '@root/app/specific/components/FoodMenu/ConsumerDiets/ExpandedRow/TableMealClients/Consumer';
import TableMealHeader from '@root/app/specific/components/FoodMenu/ConsumerDiets/ExpandedRow/TableMealClients/TableMealHeader';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
import { type ClientFoodAssignment } from '@root/types/specific';

// Types for better organization
type DishInfo = {
    id: string;
    name: string;
    allergens: { id: string; name: string }[];
    ingredients: string | null;
};

export type MealWithDishes = {
    mealName: string;
    mealId: string;
    dishes: DishInfo[];
    mealGroupId: string | null;
};

// Header component for meal types (first level)


// Header component for individual dishes (second level)
const TableDishHeader = ({ dishesByMeal, minColumnWidth }: {
    dishesByMeal: MealWithDishes[];
    dictionary: Record<string, string>;
    minColumnWidth: number;
}) => (
    <div className="flex bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-600">
        <div className="w-[250px] flex-shrink-0 p-2 border-r border-neutral-200 dark:border-neutral-600">
            {/* Empty cell for consumer column */}
        </div>
        <div className="flex flex-1">
            {dishesByMeal.map(({ dishes }) =>
                dishes.map((dish) => (
                    <div
                        key={dish.id}
                        className="p-2 border-r border-neutral-200 dark:border-neutral-600 last:border-r-0"
                        style={{
                            flex: 1,
                            minWidth: `${minColumnWidth}px`
                        }}
                    >
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium text-center">
                                {dish.name}
                            </span>
                            <AllergenList allergens={dish.allergens} variant="dish" />
                            {env.NEXT_PUBLIC_MENU_FRONT && (
                                <div className="mt-3 pt-1 w-full flex justify-end">
                                    {dish.id}
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
);

// Consumer row component
const ConsumerRow = ({ consumer, dishesByMeal, assignments, totalDishColumns, minColumnWidth }: {
    consumer: MealTableConsumerType;
    dishesByMeal: MealWithDishes[];
    assignments: ClientFoodAssignment[];
    totalDishColumns: number;
    minColumnWidth: number;
}) => {

    return (
        <div className="flex border-b border-neutral-200 dark:border-neutral-600 last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
            {/* Consumer name */}
            <Consumer
                consumer={consumer}
                hasAssignments={assignments.length > 0} />
            {/* Cells for each dish */}
            <div className="flex flex-1">
                {dishesByMeal.map(({ dishes, mealId }) =>
                    dishes.map((food) => {
                        const assignment = assignments.find(a =>
                            a.mealId === mealId &&
                            a.food.id === food.id
                        );

                        if (assignment) {
                            return (
                                <div
                                    key={`${consumer.id}-${food.id}`}
                                    className="border-r border-neutral-200 dark:border-neutral-600 last:border-r-0"
                                    style={{
                                        flex: `1 1 calc(100% / ${totalDishColumns})`,
                                        minWidth: `${minColumnWidth}px`
                                    }}
                                >
                                    <ConsumerDishCell assignment={assignment} />
                                </div>
                            );
                        }

                        return (
                            <div
                                key={`empty-${consumer.id}-${food.id}`}
                                className="p-3 border-r border-neutral-200 dark:border-neutral-600 last:border-r-0"
                                style={{
                                    flex: `1 1 calc(100% / ${totalDishColumns})`,
                                    minWidth: `${minColumnWidth}px`
                                }}
                            />
                        );
                    })
                )}
            </div>
        </div>
    )
};

// Empty state component
const EmptyConsumersState = ({ dictionary, allergens }: { dictionary: Record<string, string>, allergens: string[] }) => (
    <div className="p-6 text-center text-neutral-600 dark:text-neutral-300">
        {translate(dictionary, allergens.length ? 'menu-creator:no_consumers_with_allergens' : 'menu-creator:no-consumers-available')}
        {allergens.length > 0 && <span className="text-neutral-600 dark:text-neutral-300"> {allergens.map(a => a).join(', ')}</span>}
    </div>
);

// Main component
const TableMealClients = () => {
    const { dictionary, filter: { allergens } } = useConsumerDietsTableContext();
    const { rowClick } = useFoodMenuContext();
    const { clientConsumers, clientFoods: { data, isFetching: clientFoodsFetching } } = rowClick;
    const { rawAssignments, menuMealFoods } = data ?? { rawAssignments: [], menuMealFoods: [] };

    // console.log(rawAssignments);

    const assignments = rawAssignments ?? [];
    const { meals } = useFoodMenuContext();

    // Build dishes list per meal based on assignments
    const getAllDishesByMeal = (): MealWithDishes[] => {
        return (meals ?? []).map(meal => {
            const mealAssignments = assignments.filter(a => a.mealId === meal.id);

            const uniqueFoodMap = new Map<string, DishInfo>();

            mealAssignments.forEach(a => {
                if (!uniqueFoodMap.has(a.food.id)) {
                    uniqueFoodMap.set(a.food.id, {
                        id: a.food.id,
                        name: a.food.name,
                        allergens: a.food.allergens.map(fa => fa.allergen),
                        ingredients: a.food.ingredients,
                    });
                }
            });

            return {
                mealName: meal.name,
                mealId: meal.id,
                dishes: Array.from(uniqueFoodMap.values()),
                mealGroupId: meal.mealGroupId
            };
        });
    };

    const allDishesByMeal = getAllDishesByMeal();
    // Filter out meals with no dishes
    let dishesByMeal = allDishesByMeal.filter(meal => meal.dishes.length > 0);
    dishesByMeal = dishesByMeal.map(meal => {
        const dishesInOrder = meal.dishes.map(dish => {
            const menuMealFood = menuMealFoods.find(m => m.foodId === dish.id);
            return {
                ...dish,
                order: menuMealFood?.order ?? 0
            }
        }).sort((a, b) => a.order - b.order);
        return {
            ...meal,
            dishes: dishesInOrder
        }
    })

    const totalDishColumns = dishesByMeal.reduce((sum, { dishes }) => sum + Math.max(1, dishes.length), 0);
    const minColumnWidth = 150;

    if (clientFoodsFetching) {
        return <div className='flex justify-center items-center h-full'>
            <i className={`my-4 animate-spin fas fa-spinner text-2xl`} />
        </div>;
    }

    // If no meals have dishes, show empty state
    if (dishesByMeal.length === 0) {
        return (
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="p-6 text-center text-neutral-500 dark:text-neutral-400">
                    {translate(dictionary, 'menu-creator:no-dishes-available')}
                </div>
            </div>
        );
    }

    const filteredConsumers = clientConsumers?.filter(consumer => {
        const consumerAllergens = consumer.allergens.map(a => a.id);
        return allergens.every(allergen => consumerAllergens.includes(allergen.id));
    });

    return (
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            {/* Two-level header */}
            <div>
                <TableMealHeader
                    dishesByMeal={dishesByMeal}
                    minColumnWidth={minColumnWidth}
                />
                <TableDishHeader
                    dishesByMeal={dishesByMeal}
                    dictionary={dictionary}
                    minColumnWidth={minColumnWidth}
                />
            </div>

            {/* Data rows: Consumers */}
            <div>
                {filteredConsumers?.map((consumer) => (
                    <ConsumerRow
                        key={consumer.id}
                        consumer={consumer}
                        dishesByMeal={dishesByMeal}
                        assignments={assignments.filter(a => a.consumer.id === consumer.id)}
                        totalDishColumns={totalDishColumns}
                        minColumnWidth={minColumnWidth}
                    />
                ))}
                {(!filteredConsumers || filteredConsumers.length === 0) && (
                    <EmptyConsumersState
                        dictionary={dictionary}
                        allergens={allergens.map(a => a.name)}
                    />
                )}
            </div>
        </div>
    );
};

export default TableMealClients;