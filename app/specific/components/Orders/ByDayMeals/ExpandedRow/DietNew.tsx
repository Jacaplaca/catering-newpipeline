import { Fragment } from 'react';

import translate from '@root/app/lib/lang/translate';
import { useOrderByDayMealsTableContext } from '@root/app/specific/components/Orders/ByDayMeals/context';
import { type TransformedConsumerData } from '@root/app/server/api/routers/specific/libs/getGroupedConsumerFoodDataObject';
import { type Diet } from '@prisma/client';

const Consumer: React.FC<{
    consumerData: TransformedConsumerData & {
        consumer: {
            diet: Diet | null
        }
    }
}> = ({ consumerData }) => {
    const { consumer, meals } = consumerData;
    const diet = consumer.diet;
    return (
        <div className="text-neutral-800 dark:text-neutral-100 flex flex-col gap-1 items-start">
            <div className='font-semibold' title={diet?.description ?? ''}>
                {consumer.code}: {diet?.code}
            </div>
            <div className='pl-2'>
                {Object.values(meals).map(mealItem => (
                    <div key={mealItem.meal.id}>
                        <ul className='list-disc pl-5'>
                            {mealItem.consumerFoods.map(foodItem => (
                                <li key={foodItem.id}>
                                    {foodItem.alternativeFood ? (
                                        <>
                                            <del>{foodItem.food.name}</del>
                                            {' -> '}
                                            <u>{foodItem.alternativeFood.name}</u>
                                        </>
                                    ) : (
                                        foodItem.food.name
                                    )}
                                    {foodItem.exclusions.length > 0 && <strong>{' '}{foodItem.exclusions.map(e => e.name).join(', ')}</strong>}
                                    {foodItem.comment && <em>{' '}{foodItem.comment}</em>}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};


const OrderDetails: React.FC<{
    consumers: (TransformedConsumerData & {
        consumer: {
            diet: Diet | null
        }
    })[],
    consumersWithoutChangesCount?: number
}> = ({ consumers, consumersWithoutChangesCount = 0 }) => {
    return (
        <div className='flex flex-col gap-2 px-3 border-r-2 border-l-2 border-neutral-300 dark:border-neutral-700'>
            <div className="flex flex-col gap-2 rounded-md items-start justify-center">
                {consumers.map((consumerData) => (
                    <Consumer key={consumerData.consumer.id} consumerData={consumerData} />
                ))}
                {consumersWithoutChangesCount > 0 && (
                    <div className="text-neutral-600 dark:text-neutral-400 text-sm italic">
                        Bez zmian: {consumersWithoutChangesCount}
                    </div>
                )}
            </div>
        </div>
    )
};

const DietNew = () => {

    const {
        dictionary,
        row: { meal2data },
    } = useOrderByDayMealsTableContext();

    if (!meal2data || Object.keys(meal2data).length === 0) {
        return null;
    }

    const allMealNames = [...new Set(Object.values(meal2data).map(mealData => mealData.mealGroup.name))];

    const clients: Record<string, {
        clientInfo: {
            clientCode: string;
            clientId: string;
        },
        meals: Record<string, {
            consumers: (TransformedConsumerData & {
                consumer: {
                    diet: Diet | null
                }
            })[],
            consumersWithoutChangesCount: number;
        }>
    }> = {};

    for (const [_mealGroupId, mealData] of Object.entries(meal2data)) {
        const mealName = mealData.mealGroup.name;
        const routes = mealData.routes;
        if (!routes) continue;
        for (const route of Object.values(routes)) {
            for (const client of Object.values(route.clients)) {
                const clientCode = client.clientCode;
                if (!clients[clientCode]) {
                    clients[clientCode] = {
                        clientInfo: {
                            clientCode: client.clientCode,
                            clientId: client.clientId,
                        },
                        meals: {}
                    };
                }

                if (!clients[clientCode].meals[mealName]) {
                    clients[clientCode].meals[mealName] = {
                        consumers: [],
                        consumersWithoutChangesCount: client.consumersWithoutChangesCount || 0
                    };
                }

                const existingConsumerIds = new Set(clients[clientCode].meals[mealName]?.consumers.map(c => c.consumer._id));

                for (const consumerData of Object.values(client.consumers)) {
                    if (!existingConsumerIds.has(consumerData.consumer._id)) {

                        // const relevantMealsForConsumer = Object.values(consumerData.meals).filter(mealDetails => mealDetails.meal.name === mealName);
                        const relevantMealsForConsumer = Object.values(consumerData.meals);

                        if (relevantMealsForConsumer.length > 0) {
                            const meals = Object.fromEntries(relevantMealsForConsumer.map(m => [m.meal._id, m]));
                            const newConsumerData = {
                                ...consumerData,
                                meals
                            }
                            clients[clientCode].meals[mealName]?.consumers.push(newConsumerData);
                            existingConsumerIds.add(consumerData.consumer._id);
                        }
                    }
                }
            }
        }
    }

    const clientRowsData = Object.values(clients);

    const translations = {
        clientCode: translate(dictionary, 'orders:client_code'),
    }

    if (clientRowsData.length === 0) return null;

    return (
        <div className="flex flex-col gap-2 items-center p-2 mt-6 text-neutral-800 dark:text-neutral-200">
            <h3 className="text-lg uppercase font-semibold mb-4">{translate(dictionary, 'orders:diet')}</h3>
            <div className="w-full overflow-hidden">
                <div className="grid w-full" style={{ gridTemplateColumns: `150px repeat(${allMealNames.length}, 1fr)` }}>
                    <div className="font-bold border-b-2 border-neutral-300 dark:border-neutral-700 p-2">{translations.clientCode}</div>
                    {allMealNames.map(mealName => (
                        <div key={mealName} className="font-bold text-center border-b-2 border-neutral-300 dark:border-neutral-700 p-2">{mealName}</div>
                    ))}

                    {clientRowsData.map(({ clientInfo, meals }) => {
                        const hasOrders = meals && allMealNames.some(mealName => {
                            const meal = meals[mealName];
                            return (meal?.consumers?.length ?? 0) > 0 || (meal?.consumersWithoutChangesCount ?? 0) > 0;
                        });
                        if (!hasOrders) return null;

                        return (
                            <Fragment key={clientInfo.clientId}>
                                <div className="contents">
                                    <div className='font-bold text-base py-2'>{clientInfo.clientCode}</div>
                                    {allMealNames.map(mealName => {
                                        const mealData = meals[mealName];
                                        return (
                                            <div className='py-2' key={mealName}>
                                                {mealData && (mealData.consumers.length > 0 || mealData.consumersWithoutChangesCount > 0) ? (
                                                    <OrderDetails
                                                        consumers={mealData.consumers}
                                                        consumersWithoutChangesCount={mealData.consumersWithoutChangesCount}
                                                    />
                                                ) : <div className="px-3 border-r-2 border-l-2 border-transparent">&nbsp;</div>}
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="col-span-full h-px bg-neutral-300 dark:bg-neutral-700" />
                            </Fragment>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}

export default DietNew;