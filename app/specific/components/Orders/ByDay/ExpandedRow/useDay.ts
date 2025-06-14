import { api } from '@root/app/trpc/react';
import { useEffect, useState } from 'react';

const useDay = () => {
    const [dayId, setDayId] = useState<string | null>(null);

    const [summaryStandard, setSummaryStandard] = useState({
        breakfast: 0,
        lunch: 0,
        dinner: 0,
    });

    type StandardMealData = { meals: number; clientCode: string; clientName: string };
    type StandardRouteData = {
        breakfast: StandardMealData[];
        lunch: StandardMealData[];
        dinner: StandardMealData[];
        totalBreakfast: number;
        totalLunch: number;
        totalDinner: number;
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


    const onClick = (key: string | null) => {
        setDayId(state => state === key ? null : key);
    };

    const { data: dayData, isFetching: dayFetching }
        = api.specific.order.groupedByDay.day.useQuery(
            { dayId: dayId ?? '' },
            { enabled: Boolean(dayId) }
        );

    useEffect(() => {
        if (dayData) {
            const { summary, standard, diet } = dayData;
            const processSummary = () => {
                const { breakfastStandard, lunchStandard, dinnerStandard } = summary;
                setSummaryStandard({
                    breakfast: breakfastStandard,
                    lunch: lunchStandard,
                    dinner: dinnerStandard,
                });
            }
            const processStandard = () => {
                const processedStandard: Record<string, StandardRouteData> = {};

                const standardFromAPI = dayData.standard;

                for (const [routeName, routeDetails] of Object.entries(standardFromAPI)) {
                    // routeDetails is now of type RouteStandardDetails from the backend
                    // RouteStandardDetails: { clients: ClientStandardMeals[], totalBreakfast: number, ... }
                    // ClientStandardMeals: { clientCode: string, clientName: string, breakfast: number, lunch: number, dinner: number, ... }

                    const breakfastMeals: StandardMealData[] = [];
                    const lunchMeals: StandardMealData[] = [];
                    const dinnerMeals: StandardMealData[] = [];

                    for (const clientMeal of routeDetails.clients) {
                        if (clientMeal.breakfast > 0) {
                            breakfastMeals.push({
                                clientCode: clientMeal.clientCode,
                                clientName: clientMeal.clientName,
                                meals: clientMeal.breakfast,
                            });
                        }
                        if (clientMeal.lunch > 0) {
                            lunchMeals.push({
                                clientCode: clientMeal.clientCode,
                                clientName: clientMeal.clientName,
                                meals: clientMeal.lunch,
                            });
                        }
                        if (clientMeal.dinner > 0) {
                            dinnerMeals.push({
                                clientCode: clientMeal.clientCode,
                                clientName: clientMeal.clientName,
                                meals: clientMeal.dinner,
                            });
                        }
                    }

                    processedStandard[routeName] = {
                        breakfast: breakfastMeals,
                        lunch: lunchMeals,
                        dinner: dinnerMeals,
                        totalBreakfast: routeDetails.totalBreakfast,
                        totalLunch: routeDetails.totalLunch,
                        totalDinner: routeDetails.totalDinner,
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
        standard,
        diet,
        fetching: dayFetching
    };
};

export default useDay;