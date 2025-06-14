import { add } from '@root/app/server/lib/dashboardItems';

const managerDashboardItemsRoutes = async () => {
    console.log("21 >>> Add routes to manager...");
    return add(["routes"], "manager");
}

export default managerDashboardItemsRoutes;