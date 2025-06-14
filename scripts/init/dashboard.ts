import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
import dashboard from '@root/app/assets/dashboard.json';

async function initDashboard(reset = false) {
  if (process.env.RESET === 'yes' || reset) {
    await db.setting.deleteMany({
      where: {
        group: 'navigation', name: 'dashboard'
      }
    });
  }
  const dashboardInDb = await db.setting.findUnique({
    where: { group_name: { group: 'navigation', name: 'dashboard' } }
  });

  if (!dashboardInDb) {
    await db.setting.create({
      data: {
        access: 'PUBLIC',
        group: 'navigation',
        name: 'dashboard',
        type: 'OBJECT',
        value: JSON.stringify(dashboard)
      }
    })
  }

}

export default initDashboard;