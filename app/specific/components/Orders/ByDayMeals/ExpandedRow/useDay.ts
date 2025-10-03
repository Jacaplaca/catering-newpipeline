import { type RoutesWithConsumersByIdMap } from '@root/app/server/api/routers/specific/libs/getGroupedConsumerFoodDataObject';
import { api } from '@root/app/trpc/react';
import { useEffect, useState } from 'react';

const useDay = () => {
    const [dayId, setDayId] = useState<string | null>(null);

    const [summaryStandard, setSummaryStandard] = useState({
        breakfast: 0,
        lunch: 0,
        dinner: 0,
    });

    const [summaryConsumersWithoutChanges, setSummaryConsumersWithoutChanges] = useState({
        breakfast: 0,
        lunch: 0,
        dinner: 0,
    });

    type StandardMealData = {
        meals: number;
        clientCode: string;
        clientName: string;
        consumersWithoutChanges: number;
    };
    type StandardRouteData = {
        breakfast: StandardMealData[];
        lunch: StandardMealData[];
        dinner: StandardMealData[];
        totalBreakfast: number;
        totalLunch: number;
        totalDinner: number;
        totalBreakfastWithoutChanges: number;
        totalLunchWithoutChanges: number;
        totalDinnerWithoutChanges: number;
    };

    const [standard, setStandard] = useState<Record<string, StandardRouteData>>({});

    const [diet, setDiet] = useState<{
        breakfast: Record<string, {
            consumerCode: string, diet: {
                code: string,
                description: string,
            }
        }[]>
        lunch: Record<string, {
            consumerCode: string, diet: {
                code: string,
                description: string,
            }
        }[]>
        dinner: Record<string, {
            consumerCode: string, diet: {
                code: string,
                description: string,
            }
        }[]>
    }>({
        breakfast: {},
        lunch: {},
        dinner: {},
    })

    const [meal2data, setMeal2data] = useState<Record<string, {
        mealGroup: { name: string; id: string; createdAt: Date; updatedAt: Date; order: number; };
        routes: RoutesWithConsumersByIdMap;
        consumersWithoutChangesCount?: number;
        changesCount?: number
    }>>({});

    const onClick = (key: string | null) => {
        setDayId(state => state === key ? null : key);
    };

    const { data: dayData, isFetching: dayFetching }
        = api.specific.order.groupedByDay.day2.useQuery(
            { dayId: dayId ?? '' },
            { enabled: Boolean(dayId) }
        );

    useEffect(() => {
        if (dayData) {
            const { summary, diet, meal2data } = dayData;
            meal2data && setMeal2data(meal2data);
            const processSummary = () => {
                const { breakfastStandard, lunchStandard, dinnerStandard } = summary;
                setSummaryStandard({
                    breakfast: breakfastStandard,
                    lunch: lunchStandard,
                    dinner: dinnerStandard,
                });

                // Calculate total consumers without changes for each meal type from meal2data
                const totalWithoutChanges = { breakfast: 0, lunch: 0, dinner: 0 };

                //TODO: fix this
                // if (meal2data) {
                //     Object.entries(meal2data).forEach(([_mealGroupId, mealData]) => {
                //         const mealGroupName = mealData.mealGroup.name.toLowerCase();
                //         const mealType = mealGroupName === 'śniadanie' ? 'breakfast' :
                //             mealGroupName === 'obiad' ? 'lunch' :
                //                 mealGroupName === 'kolacja' ? 'dinner' : null;

                //         if (mealType) {
                //             // Use any to access consumersWithoutChangesCount that might exist but not in type
                //             totalWithoutChanges[mealType] += (mealData as any).consumersWithoutChangesCount ?? 0;
                //         }
                //     });
                // }

                setSummaryConsumersWithoutChanges(totalWithoutChanges);
            }
            const processStandard = () => {
                const processedStandard: Record<string, StandardRouteData> = {};

                const standardFromAPI = dayData.standard;

                // Calculate consumers without changes from meal2data for each meal type
                const consumersWithoutChangesByRoute: Record<string, { breakfast: number, lunch: number, dinner: number }> = {};

                if (meal2data) {
                    Object.entries(meal2data).forEach(([_mealGroupId, mealData]) => {
                        const mealGroupName = mealData.mealGroup.name.toLowerCase();
                        const mealType = mealGroupName === 'śniadanie' ? 'breakfast' :
                            mealGroupName === 'obiad' ? 'lunch' :
                                mealGroupName === 'kolacja' ? 'dinner' : null;

                        if (mealType) {
                            Object.values(mealData.routes).forEach(route => {
                                const routeName = route.deliveryRouteName || 'unassigned';
                                if (!consumersWithoutChangesByRoute[routeName]) {
                                    consumersWithoutChangesByRoute[routeName] = { breakfast: 0, lunch: 0, dinner: 0 };
                                }
                                consumersWithoutChangesByRoute[routeName][mealType] += route.consumersWithoutChangesCount;
                            });
                        }
                    });
                }

                for (const [routeName, routeDetails] of Object.entries(standardFromAPI)) {
                    // routeDetails is now of type RouteStandardDetails from the backend
                    // RouteStandardDetails: { clients: ClientStandardMeals[], totalBreakfast: number, ... }
                    // ClientStandardMeals: { clientCode: string, clientName: string, breakfast: number, lunch: number, dinner: number, ... }

                    const breakfastMeals: StandardMealData[] = [];
                    const lunchMeals: StandardMealData[] = [];
                    const dinnerMeals: StandardMealData[] = [];

                    for (const clientMeal of routeDetails.clients) {
                        // Get consumers without changes for this client from meal2data
                        let clientBreakfastWithoutChanges = 0;
                        let clientLunchWithoutChanges = 0;
                        let clientDinnerWithoutChanges = 0;

                        if (meal2data) {
                            Object.values(meal2data).forEach(mealData => {
                                const mealGroupName = mealData.mealGroup.name.toLowerCase();
                                const mealType = mealGroupName === 'śniadanie' ? 'breakfast' :
                                    mealGroupName === 'obiad' ? 'lunch' :
                                        mealGroupName === 'kolacja' ? 'dinner' : null;

                                if (mealType) {
                                    Object.values(mealData.routes).forEach(route => {
                                        Object.values(route.clients).forEach(client => {
                                            if (client.clientCode === clientMeal.clientCode) {
                                                if (mealType === 'breakfast') clientBreakfastWithoutChanges += client.consumersWithoutChangesCount;
                                                if (mealType === 'lunch') clientLunchWithoutChanges += client.consumersWithoutChangesCount;
                                                if (mealType === 'dinner') clientDinnerWithoutChanges += client.consumersWithoutChangesCount;
                                            }
                                        });
                                    });
                                }
                            });
                        }

                        if (clientMeal.breakfast > 0) {
                            breakfastMeals.push({
                                clientCode: clientMeal.clientCode,
                                clientName: clientMeal.clientName,
                                meals: clientMeal.breakfast,
                                consumersWithoutChanges: clientBreakfastWithoutChanges,
                            });
                        }
                        if (clientMeal.lunch > 0) {
                            lunchMeals.push({
                                clientCode: clientMeal.clientCode,
                                clientName: clientMeal.clientName,
                                meals: clientMeal.lunch,
                                consumersWithoutChanges: clientLunchWithoutChanges,
                            });
                        }
                        if (clientMeal.dinner > 0) {
                            dinnerMeals.push({
                                clientCode: clientMeal.clientCode,
                                clientName: clientMeal.clientName,
                                meals: clientMeal.dinner,
                                consumersWithoutChanges: clientDinnerWithoutChanges,
                            });
                        }
                    }

                    const routeWithoutChanges = consumersWithoutChangesByRoute[routeName] ?? { breakfast: 0, lunch: 0, dinner: 0 };

                    processedStandard[routeName] = {
                        breakfast: breakfastMeals,
                        lunch: lunchMeals,
                        dinner: dinnerMeals,
                        totalBreakfast: routeDetails.totalBreakfast,
                        totalLunch: routeDetails.totalLunch,
                        totalDinner: routeDetails.totalDinner,
                        totalBreakfastWithoutChanges: routeWithoutChanges.breakfast,
                        totalLunchWithoutChanges: routeWithoutChanges.lunch,
                        totalDinnerWithoutChanges: routeWithoutChanges.dinner,
                    };
                }
                setStandard(processedStandard);
            }
            const processDiet = () => {
                const { breakfast, lunch, dinner } = diet;
                const processedDiet = {
                    breakfast: Object.entries(breakfast).reduce((acc, [clientCode, value]) => {
                        acc[clientCode] = Object.entries(value).map(([consumerCode, diet]) => ({
                            consumerCode,
                            diet,
                        }));
                        return acc;
                    }, {} as Record<string, {
                        consumerCode: string, diet: {
                            code: string,
                            description: string,
                        }
                    }[]>),

                    lunch: Object.entries(lunch).reduce((acc, [clientCode, value]) => {
                        acc[clientCode] = Object.entries(value).map(([consumerCode, diet]) => ({
                            consumerCode,
                            diet,
                        }));
                        return acc;
                    }, {} as Record<string, {
                        consumerCode: string, diet: {
                            code: string,
                            description: string,
                        }
                    }[]>),

                    dinner: Object.entries(dinner).reduce((acc, [clientCode, value]) => {
                        acc[clientCode] = Object.entries(value).map(([consumerCode, diet]) => ({
                            consumerCode,
                            diet,
                        }));
                        return acc;
                    }, {} as Record<string, {
                        consumerCode: string, diet: {
                            code: string,
                            description: string,
                        }
                    }[]>),
                }
                setDiet(processedDiet);

            }
            processSummary();
            processStandard();
            processDiet();
        }
    }, [dayData]);

    return {
        onClick,
        dayId,
        summaryStandard,
        summaryConsumersWithoutChanges,
        standard,
        diet,
        meal2data,
        fetching: dayFetching
    };
};

export default useDay;