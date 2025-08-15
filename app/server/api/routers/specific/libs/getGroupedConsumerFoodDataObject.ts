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
};

type ConsumerDataItem = {
    consumer: Consumer & { _id: string };
    consumerFoods: ConsumerFoodItem[];
};

type MealDataItem = {
    meal: Meal & { _id: string };
    consumers: ConsumerDataItem[];
};

type ClientDataItem = {
    clientId: string;
    clientCode: string;
    client: Client;
    meals: MealDataItem[];
};

type RouteDataItem = {
    deliveryRouteId: string | null;
    deliveryRouteName: string;
    deliveryRouteCode: string;
    deliveryRoute: DeliveryRoute | null;
    clients: ClientDataItem[];
};

// Types for the transformed object structure
type ConsumersByIdMap = Record<string, ConsumerDataItem>;

type TransformedMealData = {
    meal: Meal;
    consumers: ConsumersByIdMap;
};
type MealsByIdMap = Record<string, TransformedMealData>;

type TransformedClientData = {
    clientId: string;
    clientCode: string;
    client: Client;
    meals: MealsByIdMap;
};
type ClientsByIdMap = Record<string, TransformedClientData>;

type TransformedRouteData = {
    deliveryRouteId: string | null;
    deliveryRouteName: string;
    deliveryRouteCode: string;
    deliveryRoute: DeliveryRoute | null;
    clients: ClientsByIdMap;
};
export type RoutesByIdMap = Record<string, TransformedRouteData>;

// Types for byConsumer grouping
export type MealInConsumerDataItem = {
    meal: Meal & { _id: string, order?: number };
    consumerFoods: ConsumerFoodItem[];
};

type ConsumerWithMealsDataItem = {
    consumer: Consumer & { _id: string };
    meals: MealInConsumerDataItem[];
};

type ClientWithConsumersDataItem = {
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
type MealsInConsumerByIdMap = Record<string, MealInConsumerDataItem>;

export type TransformedConsumerData = {
    consumer: Consumer & { _id: string };
    meals: MealsInConsumerByIdMap;
};
type ConsumersWithMealsByIdMap = Record<string, TransformedConsumerData>;

type TransformedClientWithConsumersData = {
    clientId: string;
    clientCode: string;
    client: Client;
    consumers: ConsumersWithMealsByIdMap;
};
type ClientsWithConsumersByIdMap = Record<string, TransformedClientWithConsumersData>;

type TransformedRouteWithConsumersData = {
    deliveryRouteId: string | null;
    deliveryRouteName: string;
    deliveryRouteCode: string;
    deliveryRoute: DeliveryRoute | null;
    clients: ClientsWithConsumersByIdMap;
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
}): Promise<RoutesWithConsumersByIdMap>;
function getGroupedConsumerFoodDataObject(args: {
    cateringId: string;
    mealIds: string[];
    dayObj: { year: number; month: number; day: number; };
    consumerIds?: string[];
    groupBy?: 'byMeal';
}): Promise<RoutesByIdMap>;
async function getGroupedConsumerFoodDataObject({
    cateringId,
    mealIds,
    dayObj,
    consumerIds,
    groupBy = 'byMeal'
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
}): Promise<RoutesByIdMap | RoutesWithConsumersByIdMap> {
    const { year, month, day } = dayObj;

    const basePipeline = [
        {
            $match: {
                cateringId: cateringId,
                mealId: { $in: mealIds },
                ...(consumerIds && { consumerId: { $in: consumerIds } })
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
                        order: '$menuMealFood.order'
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
                        mealAcc[mealId] = mealData;
                        return mealAcc;
                    }, {} as MealsInConsumerByIdMap);

                    consumerAcc[consumerId] = {
                        consumer: consumerData.consumer,
                        meals: mealsById
                    };
                    return consumerAcc;
                }, {} as ConsumersWithMealsByIdMap);

                clientAcc[clientId] = {
                    clientId: clientData.clientId,
                    clientCode: clientData.clientCode,
                    client: clientData.client,
                    consumers: consumersById
                };
                return clientAcc;
            }, {} as ClientsWithConsumersByIdMap);

            routeAcc[routeId] = {
                deliveryRouteId: routeData.deliveryRouteId,
                deliveryRouteName: routeData.deliveryRouteName,
                deliveryRouteCode: routeData.deliveryRouteCode,
                deliveryRoute: routeData.deliveryRoute,
                clients: clientsById
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
                    consumerAcc[consumerId] = consumerData;
                    return consumerAcc;
                }, {} as ConsumersByIdMap);

                mealAcc[mealId] = {
                    meal: mealData.meal,
                    consumers: consumersById
                };
                return mealAcc;
            }, {} as MealsByIdMap);

            clientAcc[clientId] = {
                clientId: clientData.clientId,
                clientCode: clientData.clientCode,
                client: clientData.client,
                meals: mealsById
            };
            return clientAcc;
        }, {} as ClientsByIdMap);

        routeAcc[routeId] = {
            deliveryRouteId: routeData.deliveryRouteId,
            deliveryRouteName: routeData.deliveryRouteName,
            deliveryRouteCode: routeData.deliveryRouteCode,
            deliveryRoute: routeData.deliveryRoute,
            clients: clientsById
        };
        return routeAcc;
    }, {} as RoutesByIdMap);

    return consumerFoodByRoute;
}

export default getGroupedConsumerFoodDataObject;