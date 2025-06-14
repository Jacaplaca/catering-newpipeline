import { type DayOrder } from '@root/app/server/api/routers/specific/libs/getDayOrders';

export interface ClientStandardMeals {
    clientCode: string;
    clientName: string;
    breakfast: number;
    lunch: number;
    dinner: number;
    totalClientMeals: number;
}

export interface RouteStandardDetails {
    clients: ClientStandardMeals[];
    totalBreakfast: number;
    totalLunch: number;
    totalDinner: number;
    totalRouteMeals: number;
}

const groupStandardOrdersByDay = (dayData: DayOrder[]): Record<string, RouteStandardDetails> => {
    const routesData: Record<string, {
        clients: Record<string, { clientName: string, breakfast: number, lunch: number, dinner: number }>,
        totalBreakfast: number,
        totalLunch: number,
        totalDinner: number
    }> = {};

    for (const order of dayData) {
        const clientCode = order.client?.info?.code;
        const clientName = order.client?.info?.name ?? 'N/A'; // Fallback for name

        if (!clientCode) continue;

        let routeName: string;
        if (order?.deliveryRoute?.code && order?.deliveryRoute?.name) {
            routeName = `[${order.deliveryRoute.code}] ${order.deliveryRoute.name}`;
        } else {
            routeName = "unassigned";
        }

        if (!routesData[routeName]) {
            routesData[routeName] = {
                clients: {},
                totalBreakfast: 0,
                totalLunch: 0,
                totalDinner: 0,
            };
        }

        const routeEntry = routesData[routeName]!;

        if (!routeEntry.clients[clientCode]) {
            routeEntry.clients[clientCode] = { clientName, breakfast: 0, lunch: 0, dinner: 0 };
        }

        const clientEntry = routeEntry.clients[clientCode];
        const breakfastOrder = order.breakfastStandard ?? 0;
        const lunchOrder = order.lunchStandard ?? 0;
        const dinnerOrder = order.dinnerStandard ?? 0;

        clientEntry.breakfast += breakfastOrder;
        clientEntry.lunch += lunchOrder;
        clientEntry.dinner += dinnerOrder;

        routeEntry.totalBreakfast += breakfastOrder;
        routeEntry.totalLunch += lunchOrder;
        routeEntry.totalDinner += dinnerOrder;
    }

    const finalGroupedData: Record<string, RouteStandardDetails> = {};

    const sortedRouteNames = Object.keys(routesData).sort((a, b) => {
        if (a === "unassigned") return 1;
        if (b === "unassigned") return -1;
        return a.localeCompare(b);
    });

    for (const routeName of sortedRouteNames) {
        const routeEntry = routesData[routeName]!;
        const clientsList: ClientStandardMeals[] = Object.entries(routeEntry.clients)
            .map(([code, data]) => ({
                clientCode: code,
                clientName: data.clientName,
                breakfast: data.breakfast,
                lunch: data.lunch,
                dinner: data.dinner,
                totalClientMeals: data.breakfast + data.lunch + data.dinner,
            }))
            .sort((a, b) => a.clientName.localeCompare(b.clientName) || a.clientCode.localeCompare(b.clientCode));

        finalGroupedData[routeName] = {
            clients: clientsList,
            totalBreakfast: routeEntry.totalBreakfast,
            totalLunch: routeEntry.totalLunch,
            totalDinner: routeEntry.totalDinner,
            totalRouteMeals: routeEntry.totalBreakfast + routeEntry.totalLunch + routeEntry.totalDinner,
        };
    }

    return finalGroupedData;
}

export default groupStandardOrdersByDay;
