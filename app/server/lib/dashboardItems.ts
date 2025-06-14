import { type RoleType } from '@prisma/client';
import { db } from '@root/app/server/db';

const add = (dashboardItems: string[], roleId: RoleType) => {
    return db.role.update({
        where: { id: roleId },
        data: {
            dashboardItems: {
                push: dashboardItems
            }
        }
    });
}

const addGroups = (dashboardGroups: string[], roleId: RoleType) => {
    return db.role.update({
        where: { id: roleId },
        data: {
            dashboardGroups: { push: dashboardGroups }
        }
    });
}

const remove = async (itemsToRemove: string[], roleId: RoleType) => {
    const role = await db.role.findUnique({ where: { id: roleId } });
    if (!role) {
        console.error(`Role with id ${roleId} not found`);
        return;
    };
    const dashboardItems = role.dashboardItems.filter((item) => !itemsToRemove.includes(item));
    return db.role.update({
        where: { id: roleId },
        data: { dashboardItems }
    });
}

export { add, remove, addGroups };
