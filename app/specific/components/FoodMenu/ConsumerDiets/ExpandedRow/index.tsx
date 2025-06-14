import ExpandedRow from '@root/app/_components/Table/ExpandedRow';
import { useConsumerDietsTableContext } from '@root/app/specific/components/FoodMenu/ConsumerDiets/context';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
import AllergenList from './AllergenList';
import ConsumerDishCell from './ConsumerDishCell';
import translate from '@root/app/lib/lang/translate';

const ConsumerDietsExpandedRow = () => {

    // assignments – tablica obiektów consumer-meal-food
    const { dictionary, rowClick: { clientConsumers, clientFoods: { data: rawAssignments } } } = useConsumerDietsTableContext();

    // Strongly-typed list of assignments (contains allergens)
    const assignments = rawAssignments ?? [];

    // nadal potrzebujemy listy posiłków z kontekstu menu
    const { meals } = useFoodMenuContext();

    // Build dishes list per meal based on assignments
    const getAllDishesByMeal = () => {
        return (meals ?? []).map(meal => {
            const mealAssignments = assignments.filter(a => a.mealId === meal.id);

            // Create food objects simplified for UI: id, name, allergens (flattened)
            const uniqueFoodMap = new Map<string, { id: string; name: string; allergens: { id: string; name: string }[]; ingredients: string | null }>();

            mealAssignments.forEach(a => {
                if (!uniqueFoodMap.has(a.food.id)) {
                    uniqueFoodMap.set(a.food.id, {
                        id: a.food.id,
                        name: a.food.name,
                        allergens: a.food.allergens.map(fa => fa.allergen),
                        ingredients: a.food.ingredients,
                        // flatten to {id,name}
                    });
                }
            });

            return {
                mealName: meal.name,
                mealId: meal.id,
                dishes: Array.from(uniqueFoodMap.values())
            };
        });
    };

    const dishesByMeal = getAllDishesByMeal();
    console.log(dishesByMeal);
    // console.log(meals);

    // Calculate total number of dish columns
    const totalDishColumns = dishesByMeal.reduce((sum, { dishes }) => sum + Math.max(1, dishes.length), 0);

    // Minimum column width
    const minColumnWidth = 150;

    return (<ExpandedRow>
        <div className='relative'>
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                {/* Two-level header */}
                <div>
                    {/* First level: Meal types */}
                    <div className="flex bg-neutral-100 dark:bg-neutral-700 border-b border-neutral-200 dark:border-neutral-600">
                        <div className="w-[150px] flex-shrink-0 p-2 border-r border-neutral-200 dark:border-neutral-600">
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{translate(dictionary, 'menu-creator:consumer')}</h3>
                        </div>
                        <div className="flex flex-1">
                            {dishesByMeal.map(({ mealName, dishes }) => {
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
                                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 p-2">
                                            {mealName}
                                        </h3>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Second level: Individual dishes */}
                    <div className="flex bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-600">
                        <div className="w-[150px] flex-shrink-0 p-2 border-r border-neutral-200 dark:border-neutral-600">
                            {/* Empty cell for consumer column */}
                        </div>
                        <div className="flex flex-1">
                            {dishesByMeal.map(({ dishes, mealName }) => {
                                if (dishes.length > 0) {
                                    return dishes.map((dish) => (
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
                                            </div>
                                        </div>
                                    ));
                                } else {
                                    // Empty column when no dishes
                                    return (
                                        <div
                                            key={`empty-${mealName}`}
                                            className="p-2 border-r border-neutral-200 dark:border-neutral-600 last:border-r-0"
                                            style={{
                                                flex: 1,
                                                minWidth: `${minColumnWidth}px`
                                            }}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium text-center">
                                                    {translate(dictionary, 'menu-creator:no-dishes')}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }
                            })}
                        </div>
                    </div>
                </div>

                {/* Data rows: Consumers */}
                <div>
                    {clientConsumers?.map((consumer) => (
                        <div key={consumer.id} className="flex border-b border-neutral-200 dark:border-neutral-600 last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                            {/* Consumer name */}
                            <div className="w-[150px] flex-shrink-0 p-3 border-r border-neutral-200 dark:border-neutral-600">
                                <div className="flex flex-col gap-1">
                                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                        {consumer.name}
                                    </span>
                                    <AllergenList allergens={consumer.allergens} variant="consumer" />
                                </div>
                            </div>
                            {/* Cells for each dish */}
                            <div className="flex flex-1">
                                {dishesByMeal.map(({ dishes, mealId, mealName }) => {
                                    const columnCount = Math.max(1, dishes.length);
                                    if (dishes.length > 0) {
                                        return dishes.map((food) => {
                                            const assignment = assignments.find(a =>
                                                a.consumer.id === consumer.id &&
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
                                                        <ConsumerDishCell
                                                            assignment={assignment}
                                                        />
                                                    </div>
                                                );
                                            }

                                            // brak przypisania → pusta komórka
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
                                        });
                                    } else {
                                        // Empty cell when no dishes - should match the header group width
                                        return (
                                            <div
                                                key={`empty-${consumer.id}-${mealName}`}
                                                className="p-3 border-r border-neutral-200 dark:border-neutral-600 last:border-r-0"
                                                style={{
                                                    flex: `${columnCount} 1 calc(100% * ${columnCount} / ${totalDishColumns})`,
                                                    minWidth: `${minColumnWidth * columnCount}px`
                                                }}
                                            >
                                                {/* Empty cell */}
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        </div>
                    ))}
                    {(!clientConsumers || clientConsumers.length === 0) && (
                        <div className="p-6 text-center text-neutral-500 dark:text-neutral-400">
                            {translate(dictionary, 'menu-creator:no-consumers-available')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </ExpandedRow>

    );
}


export default ConsumerDietsExpandedRow;