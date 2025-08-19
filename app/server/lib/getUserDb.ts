// getUserDb.ts
import { type RoleType } from '@prisma/client';
import { settings } from '@root/config/config';
import { db } from "server/db";

export const getUserByEmailFromDB = async (email = "") => {
    return await db.user.findUnique({
        where: {
            email
        },
    })
}

export const getMasterHash = async () => {
    const user = await db.user.findFirst({
        where: {
            roleId: settings.superAdminRole as RoleType,
        },
        select: {
            passwordHash: true,
        }
    });
    return user?.passwordHash;
}

export const getUserByIdFromDB = async (id = "") => {
    return await db.user.findUnique({
        where: {
            id
        },
    })
}