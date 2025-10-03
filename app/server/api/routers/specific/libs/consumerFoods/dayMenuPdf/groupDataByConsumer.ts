import { type MealGroup, type Consumer } from '@prisma/client';
import { type GetDayFoodDataResult } from '@root/app/server/api/routers/specific/libs/getDayFoodData';
import {
    type RoutesWithConsumersByIdMap,
    type TransformedRouteWithConsumersData,
    type TransformedClientWithConsumersData,
} from '@root/app/server/api/routers/specific/libs/getGroupedConsumerFoodDataObject';

// Type aliases for the data structure
type ConsumerInfo = Consumer & { _id: string };
type WeekData = GetDayFoodDataResult;
type DailyData = Record<string, MealGroupData>;
type MealGroupData = {
    mealGroup: MealGroup;
    routes: RoutesWithConsumersByIdMap;
};
type RouteData = TransformedRouteWithConsumersData;
type ClientData = TransformedClientWithConsumersData;

export type GroupedByConsumer = {
    consumer: ConsumerInfo;
    data: WeekData;
};

/**
 * Grupuje dane tygodniowe według unikalnych konsumentów.
 *
 * @param weekData - Oryginalny obiekt z danymi dla całego tygodnia.
 * @returns Tablica obiektów, gdzie każdy obiekt zawiera dane konsumenta
 *          oraz odfiltrowaną strukturę danych `WeekData` tylko dla niego.
 */
function groupDataByConsumer(weekData: GetDayFoodDataResult): GroupedByConsumer[] {
    // Krok 1: Znajdź wszystkich unikalnych konsumentów w całej strukturze danych.
    // Używamy obiektu Map, aby uniknąć duplikatów, kluczem jest ID konsumenta.
    const consumersMap = new Map<string, ConsumerInfo>();

    for (const date in weekData) {
        const dailyData = weekData[date];
        if (!dailyData) continue;

        for (const mealGroupId in dailyData) {
            const mealGroup = dailyData[mealGroupId];
            if (!mealGroup) continue;

            for (const routeId in mealGroup.routes) {
                const route = mealGroup.routes[routeId];
                if (!route) continue;

                for (const clientId in route.clients) {
                    const client = route.clients[clientId];
                    if (!client) continue;

                    for (const consumerId in client.consumers) {
                        const consumerData = client.consumers[consumerId];
                        if (!consumerData) continue;

                        if (!consumersMap.has(consumerData.consumer._id)) {
                            consumersMap.set(consumerData.consumer._id, consumerData.consumer);
                        }
                    }
                }
            }
        }
    }

    const uniqueConsumers = Array.from(consumersMap.values());

    // Krok 2: Dla każdego unikalnego konsumenta stwórz nową, odfiltrowaną strukturę danych.
    const result: GroupedByConsumer[] = uniqueConsumers.map(consumer => {
        const filteredWeekData: WeekData = {};

        // Iteruj po oryginalnych danych, aby odbudować strukturę
        for (const date in weekData) {
            const originalDailyData = weekData[date];
            if (!originalDailyData) continue;

            const filteredDailyData: DailyData = {};

            for (const mealGroupId in originalDailyData) {
                const originalMealGroupData = originalDailyData[mealGroupId];
                if (!originalMealGroupData) continue;

                // Kopiujemy metadane grupy posiłków, ale trasy tworzymy od zera
                const filteredMealGroupData: MealGroupData = {
                    ...originalMealGroupData,
                    routes: {},
                };

                for (const routeId in originalMealGroupData.routes) {
                    const originalRouteData = originalMealGroupData.routes[routeId];
                    if (!originalRouteData) continue;

                    const filteredRouteData: RouteData = {
                        ...originalRouteData,
                        clients: {},
                    };

                    for (const clientId in originalRouteData.clients) {
                        const originalClientData = originalRouteData.clients[clientId];
                        if (!originalClientData) continue;

                        // Sprawdź, czy obecny konsument istnieje w danych klienta
                        const targetConsumerData = originalClientData.consumers[consumer._id];

                        if (targetConsumerData) {
                            // Jeśli tak, utwórz nowy obiekt klienta tylko z tym jednym konsumentem
                            const filteredClientData: ClientData = {
                                ...originalClientData,
                                consumers: {
                                    [consumer._id]: targetConsumerData,
                                },
                            };
                            filteredRouteData.clients[clientId] = filteredClientData;
                        }
                    }

                    // Dodaj trasę do grupy posiłków tylko, jeśli zawiera jakichś klientów (po filtrowaniu)
                    if (Object.keys(filteredRouteData.clients).length > 0) {
                        filteredMealGroupData.routes[routeId] = filteredRouteData;
                    }
                }

                // Dodaj grupę posiłków do dnia tylko, jeśli zawiera jakieś trasy
                if (Object.keys(filteredMealGroupData.routes).length > 0) {
                    filteredDailyData[mealGroupId] = filteredMealGroupData;
                }
            }

            // Dodaj dzień do wynikowej struktury tylko, jeśli zawiera jakieś grupy posiłków
            if (Object.keys(filteredDailyData).length > 0) {
                filteredWeekData[date] = filteredDailyData;
            }
        }

        return {
            consumer: consumer,
            data: filteredWeekData,
        };
    });

    return result;
}

export default groupDataByConsumer;