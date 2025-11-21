import { add } from '@root/app/server/lib/dashboardItems';

const managerDashboardItemsActivityLog = async () => {
    console.log("32 >>> Add activity-log to manager...");
    return add(["activity-log"], "manager");
}

export default managerDashboardItemsActivityLog;