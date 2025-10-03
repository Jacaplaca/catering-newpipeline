import { db } from '@root/app/server/db';
import { type Food, type Meal, type Consumer, type Client, type DeliveryRoute, type Exclusion } from "@prisma/client";

export type ConsumerFoodItem = {
    id: string;
    food: Food;
    alternativeFood: Food | null;
    comment: string | null;
    ignoredAllergens: string[];
    exclusions: Exclusion[];
    order: number | null;
    isChanged: boolean;
};

type ConsumerDataItem = {
    consumer: Consumer & { _id: string };
    consumerFoods: ConsumerFoodItem[];
    changesCount: number;
};

type MealDataItem = {
    meal: Meal & { _id: string };
    consumers: ConsumerDataItem[];
    changesCount: number;
};

type ClientDataItem = {
    clientId: string;
    clientCode: string;
    client: Client;
    meals: MealDataItem[];
    changesCount: number;
};

type RouteDataItem = {
    deliveryRouteId: string | null;
    deliveryRouteName: string;
    deliveryRouteCode: string;
    deliveryRoute: DeliveryRoute | null;
    clients: ClientDataItem[];
    changesCount: number;
};

// Types for the transformed object structure
type ConsumersByIdMap = Record<string, ConsumerDataItem>;

type TransformedMealData = {
    meal: Meal;
    consumers: ConsumersByIdMap;
    changesCount: number;
    consumersWithChangesCount: number;
    consumersWithoutChangesCount: number;
};
type MealsByIdMap = Record<string, TransformedMealData>;

type TransformedClientData = {
    clientId: string;
    clientCode: string;
    client: Client;
    meals: MealsByIdMap;
    changesCount: number;
    mealsWithChangesCount: number;
    mealsWithoutChangesCount: number;
    consumersWithoutChangesCount: number;
};
type ClientsByIdMap = Record<string, TransformedClientData>;

type TransformedRouteData = {
    deliveryRouteId: string | null;
    deliveryRouteName: string;
    deliveryRouteCode: string;
    deliveryRoute: DeliveryRoute | null;
    clients: ClientsByIdMap;
    changesCount: number;
    mealsWithChangesCount: number;
    mealsWithoutChangesCount: number;
    consumersWithoutChangesCount: number;
};
export type RoutesByIdMap = Record<string, TransformedRouteData>;

// Types for byConsumer grouping
export type MealInConsumerDataItem = {
    meal: Meal & { _id: string, order?: number };
    consumerFoods: ConsumerFoodItem[];
    changesCount: number;
};

type ConsumerWithMealsDataItem = {
    consumer: Consumer & { _id: string };
    meals: MealInConsumerDataItem[];
    changesCount: number;
};

export type ClientWithConsumersDataItem = {
    clientId: string;
    clientCode: string;
    client: Client;
    consumers: ConsumerWithMealsDataItem[];
};

type RouteWithClientsByConsumerDataItem = {
    deliveryRouteId: string | null;
    deliveryRouteName: string;
    deliveryRouteCode: string;
    deliveryRoute: DeliveryRoute | null;
    clients: ClientWithConsumersDataItem[];
};

// Types for the transformed object structure by consumer
export type MealsInConsumerByIdMap = Record<string, MealInConsumerDataItem>;

export type TransformedConsumerData = {
    consumer: Consumer & { _id: string };
    meals: MealsInConsumerByIdMap;
    changesCount: number;
};
export type ConsumersWithMealsByIdMap = Record<string, TransformedConsumerData>;

export type TransformedClientWithConsumersData = {
    clientId: string;
    clientCode: string;
    client: Client;
    consumers: ConsumersWithMealsByIdMap;
    changesCount: number;
    mealsWithChangesCount: number;
    mealsWithoutChangesCount: number;
    consumersWithoutChangesCount: number;
};
export type ClientsWithConsumersByIdMap = Record<string, TransformedClientWithConsumersData>;

export type TransformedRouteWithConsumersData = {
    deliveryRouteId: string | null;
    deliveryRouteName: string;
    deliveryRouteCode: string;
    deliveryRoute: DeliveryRoute | null;
    clients: ClientsWithConsumersByIdMap;
    changesCount: number;
    mealsWithChangesCount: number;
    mealsWithoutChangesCount: number;
    consumersWithoutChangesCount: number;
};
export type RoutesWithConsumersByIdMap = Record<string, TransformedRouteWithConsumersData>;


type ConsumerFoodDataByMeal = RouteDataItem[];
type ConsumerFoodDataByConsumer = RouteWithClientsByConsumerDataItem[];

function getGroupedConsumerFoodDataObject(args: {
    cateringId: string;
    mealIds: string[];
    dayObj: { year: number; month: number; day: number; };
    consumerIds?: string[];
    groupBy: 'byConsumer';
    clientId?: string;
}): Promise<RoutesWithConsumersByIdMap>;
function getGroupedConsumerFoodDataObject(args: {
    cateringId: string;
    mealIds: string[];
    dayObj: { year: number; month: number; day: number; };
    consumerIds?: string[];
    groupBy?: 'byMeal';
    clientId?: string;
}): Promise<RoutesByIdMap>;
async function getGroupedConsumerFoodDataObject({
    cateringId,
    mealIds,
    dayObj,
    consumerIds,
    groupBy = 'byMeal',
    clientId
}: {
    cateringId: string;
    mealIds: string[];
    dayObj: {
        year: number;
        month: number;
        day: number;
    };
    consumerIds?: string[];
    groupBy?: 'byMeal' | 'byConsumer';
    clientId?: string;
}): Promise<RoutesByIdMap | RoutesWithConsumersByIdMap> {
    const { year, month, day } = dayObj;

    const basePipeline = [
        {
            $match: {
                cateringId: cateringId,
                mealId: { $in: mealIds },
                ...(consumerIds && { consumerId: { $in: consumerIds } }),
                ...(clientId && { clientId: clientId })
            }
        },
        {
            $lookup: {
                from: 'RegularMenu',
                localField: 'regularMenuId',
                foreignField: '_id',
                as: 'regularMenu'
            }
        },
        {
            $unwind: '$regularMenu'
        },
        {
            $match: {
                'regularMenu.day': {
                    year,
                    month,
                    day
                },
                'regularMenu.cateringId': cateringId
            }
        },
        {
            $lookup: {
                from: 'Client',
                localField: 'clientId',
                foreignField: '_id',
                as: 'client'
            }
        },
        {
            $unwind: '$client'
        },
        {
            $lookup: {
                from: 'DeliveryRoute',
                localField: 'client.deliveryRouteId',
                foreignField: '_id',
                as: 'deliveryRoute'
            }
        },
        {
            $unwind: {
                path: '$deliveryRoute',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: 'Consumer',
                localField: 'consumerId',
                foreignField: '_id',
                as: 'consumer'
            }
        },
        {
            $unwind: '$consumer'
        },
        {
            $lookup: {
                from: 'Meal',
                localField: 'mealId',
                foreignField: '_id',
                as: 'meal'
            }
        },
        {
            $unwind: '$meal'
        },
        {
            $lookup: {
                from: 'Food',
                localField: 'foodId',
                foreignField: '_id',
                as: 'food'
            }
        },
        {
            $unwind: '$food'
        },
        {
            $lookup: {
                from: 'MenuMealFood',
                let: {
                    regularMenuId: '$regularMenu._id',
                    mealId: '$meal._id',
                    foodId: '$food._id'
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$regularMenuId', '$$regularMenuId'] },
                                    { $eq: ['$mealId', '$$mealId'] },
                                    { $eq: ['$foodId', '$$foodId'] }
                                ]
                            }
                        }
                    }
                ],
                as: 'menuMealFood'
            }
        },
        {
            $unwind: {
                path: '$menuMealFood',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: 'Food',
                localField: 'alternativeFoodId',
                foreignField: '_id',
                as: 'alternativeFood'
            }
        },
        {
            $unwind: {
                path: '$alternativeFood',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: 'ConsumerFoodExclusion',
                localField: '_id',
                foreignField: 'consumerFoodId',
                as: 'consumerFoodExclusions'
            }
        },
        {
            $lookup: {
                from: 'Exclusion',
                localField: 'consumerFoodExclusions.exclusionId',
                foreignField: '_id',
                as: 'exclusions'
            }
        },
        {
            $group: {
                _id: {
                    clientId: '$clientId',
                    clientCode: '$client.info.code',
                    mealId: '$mealId',
                    mealName: '$meal.name',
                    consumerId: '$consumerId',
                    consumerCode: '$consumer.code'
                },
                client: { $first: '$client' },
                meal: { $first: '$meal' },
                consumer: { $first: '$consumer' },
                deliveryRoute: { $first: '$deliveryRoute' },
                consumerFoods: {
                    $push: {
                        id: '$_id',
                        food: '$food',
                        alternativeFood: '$alternativeFood',
                        comment: '$comment',
                        ignoredAllergens: '$ignoredAllergens',
                        exclusions: '$exclusions',
                        order: '$menuMealFood.order',
                        isChanged: {
                            $or: [
                                { $ne: [{ $ifNull: ['$alternativeFoodId', null] }, null] },
                                { $ne: [{ $ifNull: ['$comment', ''] }, ''] },
                                { $gt: [{ $size: '$exclusions' }, 0] }
                            ]
                        }
                    }
                }
            }
        }
    ];

    const byMealGrouping = [
        {
            $group: {
                _id: {
                    clientId: '$_id.clientId',
                    clientCode: '$_id.clientCode',
                    mealId: '$_id.mealId',
                    mealName: '$_id.mealName'
                },
                client: { $first: '$client' },
                meal: { $first: '$meal' },
                deliveryRoute: { $first: '$deliveryRoute' },
                consumers: {
                    $push: {
                        consumer: '$consumer',
                        consumerFoods: '$consumerFoods'
                    }
                }
            }
        },
        {
            $group: {
                _id: {
                    clientId: '$_id.clientId',
                    clientCode: '$_id.clientCode'
                },
                client: { $first: '$client' },
                deliveryRoute: { $first: '$deliveryRoute' },
                meals: {
                    $push: {
                        meal: '$meal',
                        consumers: '$consumers'
                    }
                }
            }
        },
        {
            $group: {
                _id: {
                    deliveryRouteId: { $ifNull: ['$deliveryRoute._id', null] },
                    deliveryRouteName: { $ifNull: ['$deliveryRoute.name', 'Bez trasy'] },
                    deliveryRouteCode: { $ifNull: ['$deliveryRoute.code', 'NO_ROUTE'] }
                },
                deliveryRoute: { $first: '$deliveryRoute' },
                clients: {
                    $push: {
                        clientId: '$_id.clientId',
                        clientCode: '$_id.clientCode',
                        client: '$client',
                        meals: '$meals'
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                deliveryRouteId: '$_id.deliveryRouteId',
                deliveryRouteName: '$_id.deliveryRouteName',
                deliveryRouteCode: '$_id.deliveryRouteCode',
                deliveryRoute: 1,
                clients: 1
            }
        }
    ];

    const byConsumerGrouping = [
        {
            $group: {
                _id: {
                    clientId: '$_id.clientId',
                    clientCode: '$_id.clientCode',
                    consumerId: '$_id.consumerId',
                    consumerCode: '$_id.consumerCode'
                },
                client: { $first: '$client' },
                consumer: { $first: '$consumer' },
                deliveryRoute: { $first: '$deliveryRoute' },
                meals: {
                    $push: {
                        meal: '$meal',
                        consumerFoods: '$consumerFoods'
                    }
                }
            }
        },
        {
            $group: {
                _id: {
                    clientId: '$_id.clientId',
                    clientCode: '$_id.clientCode'
                },
                client: { $first: '$client' },
                deliveryRoute: { $first: '$deliveryRoute' },
                consumers: {
                    $push: {
                        consumer: '$consumer',
                        meals: '$meals'
                    }
                }
            }
        },
        {
            $group: {
                _id: {
                    deliveryRouteId: { $ifNull: ['$deliveryRoute._id', null] },
                    deliveryRouteName: { $ifNull: ['$deliveryRoute.name', 'Bez trasy'] },
                    deliveryRouteCode: { $ifNull: ['$deliveryRoute.code', 'NO_ROUTE'] }
                },
                deliveryRoute: { $first: '$deliveryRoute' },
                clients: {
                    $push: {
                        clientId: '$_id.clientId',
                        clientCode: '$_id.clientCode',
                        client: '$client',
                        consumers: '$consumers'
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                deliveryRouteId: '$_id.deliveryRouteId',
                deliveryRouteName: '$_id.deliveryRouteName',
                deliveryRouteCode: '$_id.deliveryRouteCode',
                deliveryRoute: 1,
                clients: 1
            }
        }
    ];

    const pipeline = [
        ...basePipeline,
        ...(groupBy === 'byMeal' ? byMealGrouping : byConsumerGrouping)
    ];

    const consumerFoodData = await db.consumerFood.aggregateRaw({
        pipeline
    });

    if (groupBy === 'byConsumer') {
        const consumerFoodDataTyped = consumerFoodData as unknown as ConsumerFoodDataByConsumer;

        const consumerFoodByRoute = consumerFoodDataTyped.reduce((routeAcc: RoutesWithConsumersByIdMap, routeData) => {
            const routeId = routeData.deliveryRouteId ?? 'NO_ROUTE';

            const clientsById = routeData.clients.reduce((clientAcc: ClientsWithConsumersByIdMap, clientData) => {
                const clientId = clientData.clientId;

                const consumersById = clientData.consumers.reduce((consumerAcc: ConsumersWithMealsByIdMap, consumerData) => {
                    const consumerId = consumerData.consumer._id;

                    const mealsById = consumerData.meals.reduce((mealAcc: MealsInConsumerByIdMap, mealData) => {
                        const mealId = mealData.meal._id;
                        mealAcc[mealId] = { ...mealData, changesCount: mealData.consumerFoods.filter(({ isChanged }) => isChanged).length };
                        return mealAcc;
                    }, {} as MealsInConsumerByIdMap);

                    consumerAcc[consumerId] = {
                        consumer: consumerData.consumer,
                        meals: mealsById,
                        changesCount: Object.values(mealsById).reduce((acc, meal) => acc + meal.changesCount, 0)
                    };
                    return consumerAcc;
                }, {} as ConsumersWithMealsByIdMap);

                // Dla grupowania byConsumer - konsumenci bez zmian to ci, którzy nie mają zmian we wszystkich swoich posiłkach
                const consumersWithoutChanges = Object.values(consumersById).filter(consumer => consumer.changesCount === 0);

                clientAcc[clientId] = {
                    clientId: clientData.clientId,
                    clientCode: clientData.clientCode,
                    client: clientData.client,
                    consumers: consumersById,
                    mealsWithChangesCount: Object.values(consumersById).reduce((acc, consumer) => acc + (consumer.changesCount ? 1 : 0), 0),
                    mealsWithoutChangesCount: Object.values(consumersById).reduce((acc, consumer) => acc + (consumer.changesCount ? 0 : 1), 0),
                    consumersWithoutChangesCount: consumersWithoutChanges.length,
                    changesCount: Object.values(consumersById).reduce((acc, consumer) => acc + consumer.changesCount, 0)
                };
                return clientAcc;
            }, {} as ClientsWithConsumersByIdMap);

            // Znajdź konsumentów na trasie, którzy nie mają zmian we wszystkich swoich posiłkach
            const routeAllConsumerIdsSet = new Set<string>();
            const routeConsumersWithChangesSet = new Set<string>();

            Object.values(clientsById).forEach(client => {
                Object.values(client.consumers).forEach(consumer => {
                    routeAllConsumerIdsSet.add(consumer.consumer._id);
                    if (consumer.changesCount > 0) {
                        routeConsumersWithChangesSet.add(consumer.consumer._id);
                    }
                });
            });

            // Konsumenci bez zmian to ci, którzy są w routeAllConsumerIdsSet ale nie ma ich w routeConsumersWithChangesSet
            const routeUniqueConsumersWithoutChangesSet = new Set<string>();
            routeAllConsumerIdsSet.forEach(consumerId => {
                if (!routeConsumersWithChangesSet.has(consumerId)) {
                    routeUniqueConsumersWithoutChangesSet.add(consumerId);
                }
            });

            routeAcc[routeId] = {
                deliveryRouteId: routeData.deliveryRouteId,
                deliveryRouteName: routeData.deliveryRouteName,
                deliveryRouteCode: routeData.deliveryRouteCode,
                deliveryRoute: routeData.deliveryRoute,
                clients: clientsById,
                mealsWithChangesCount: Object.values(clientsById).reduce((acc, client) => acc + client.mealsWithChangesCount, 0),
                mealsWithoutChangesCount: Object.values(clientsById).reduce((acc, client) => acc + client.mealsWithoutChangesCount, 0),
                consumersWithoutChangesCount: routeUniqueConsumersWithoutChangesSet.size,
                changesCount: Object.values(clientsById).reduce((acc, client) => acc + client.changesCount, 0)
            };
            return routeAcc;
        }, {} as RoutesWithConsumersByIdMap);

        return consumerFoodByRoute;
    }

    const consumerFoodDataTyped = consumerFoodData as unknown as ConsumerFoodDataByMeal;
    const consumerFoodByRoute: RoutesByIdMap = consumerFoodDataTyped.reduce((routeAcc, routeData) => {
        const routeId = routeData.deliveryRouteId ?? 'NO_ROUTE';

        const clientsById = routeData.clients.reduce((clientAcc: ClientsByIdMap, clientData: ClientDataItem) => {
            const clientId = clientData.clientId;

            const mealsById = clientData.meals.reduce((mealAcc: MealsByIdMap, mealData: MealDataItem) => {
                const mealId = mealData.meal._id;

                const consumersById = mealData.consumers.reduce((consumerAcc: ConsumersByIdMap, consumerData: ConsumerDataItem) => {
                    const consumerId = consumerData.consumer._id;
                    consumerAcc[consumerId] = { ...consumerData, changesCount: consumerData.consumerFoods.filter(({ isChanged }) => isChanged).length };
                    return consumerAcc;
                }, {} as ConsumersByIdMap);

                mealAcc[mealId] = {
                    meal: mealData.meal,
                    consumers: consumersById,
                    consumersWithChangesCount: Object.values(consumersById).reduce((acc, consumer) => acc + (consumer.changesCount ? 1 : 0), 0),
                    consumersWithoutChangesCount: Object.values(consumersById).reduce((acc, consumer) => acc + (consumer.changesCount ? 0 : 1), 0),
                    changesCount: Object.values(consumersById).reduce((acc, consumer) => acc + consumer.changesCount, 0)
                };
                return mealAcc;
            }, {} as MealsByIdMap);

            // Znajdź konsumentów, którzy nie mają zmian we wszystkich swoich posiłkach
            const allConsumerIds = new Set<string>();
            const consumersWithChanges = new Set<string>();

            Object.values(mealsById).forEach(meal => {
                Object.values(meal.consumers).forEach(consumer => {
                    allConsumerIds.add(consumer.consumer._id);
                    if (consumer.changesCount > 0) {
                        consumersWithChanges.add(consumer.consumer._id);
                    }
                });
            });

            // Konsumenci bez zmian to ci, którzy są w allConsumerIds ale nie ma ich w consumersWithChanges
            const uniqueConsumersWithoutChanges = new Set<string>();
            allConsumerIds.forEach(consumerId => {
                if (!consumersWithChanges.has(consumerId)) {
                    uniqueConsumersWithoutChanges.add(consumerId);
                }
            });

            clientAcc[clientId] = {
                clientId: clientData.clientId,
                clientCode: clientData.clientCode,
                client: clientData.client,
                meals: mealsById,
                mealsWithChangesCount: Object.values(mealsById).reduce((acc, meal) => acc + meal.consumersWithChangesCount, 0),
                mealsWithoutChangesCount: Object.values(mealsById).reduce((acc, meal) => acc + meal.consumersWithoutChangesCount, 0),
                consumersWithoutChangesCount: uniqueConsumersWithoutChanges.size,
                changesCount: Object.values(mealsById).reduce((acc, meal) => acc + meal.changesCount, 0)
            };
            return clientAcc;
        }, {} as ClientsByIdMap);

        // Znajdź konsumentów na trasie, którzy nie mają zmian we wszystkich swoich posiłkach
        const routeAllConsumerIds = new Set<string>();
        const routeConsumersWithChanges = new Set<string>();

        Object.values(clientsById).forEach(client => {
            Object.values(client.meals).forEach(meal => {
                Object.values(meal.consumers).forEach(consumer => {
                    routeAllConsumerIds.add(consumer.consumer._id);
                    if (consumer.changesCount > 0) {
                        routeConsumersWithChanges.add(consumer.consumer._id);
                    }
                });
            });
        });

        // Konsumenci bez zmian to ci, którzy są w routeAllConsumerIds ale nie ma ich w routeConsumersWithChanges
        const routeUniqueConsumersWithoutChanges = new Set<string>();
        routeAllConsumerIds.forEach(consumerId => {
            if (!routeConsumersWithChanges.has(consumerId)) {
                routeUniqueConsumersWithoutChanges.add(consumerId);
            }
        });

        routeAcc[routeId] = {
            deliveryRouteId: routeData.deliveryRouteId,
            deliveryRouteName: routeData.deliveryRouteName,
            deliveryRouteCode: routeData.deliveryRouteCode,
            deliveryRoute: routeData.deliveryRoute,
            clients: clientsById,
            mealsWithChangesCount: Object.values(clientsById).reduce((acc, client) => acc + client.mealsWithChangesCount, 0),
            mealsWithoutChangesCount: Object.values(clientsById).reduce((acc, client) => acc + client.mealsWithoutChangesCount, 0),
            consumersWithoutChangesCount: routeUniqueConsumersWithoutChanges.size,
            changesCount: Object.values(clientsById).reduce((acc, client) => acc + client.changesCount, 0)
        };
        return routeAcc;
    }, {} as RoutesByIdMap);

    return consumerFoodByRoute;
}

export default getGroupedConsumerFoodDataObject;