import { RoleType } from '@prisma/client';
import getClientSettings from '@root/app/server/api/routers/specific/libs/getUserSettings';
import checkIfHasFinishedSettings from '@root/app/server/api/routers/specific/libs/hasFinishedSettings';
import { createCateringNotSettingsProcedure, createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { createRoleProcedure, publicProcedure } from '@root/app/server/api/trpc';
import { getSettingsGroup } from '@root/app/server/cache/settings';
import { clientSettingsValidator, dieticianSettingsValidator, managerSettingsValidator, getClientSettingsValidator, kitchenSettingsValidator } from '@root/app/validators/specific/settings';

const managerSettings = createCateringNotSettingsProcedure([RoleType.manager])
    .query(({ ctx }) => {
        const { session } = ctx;
        const { catering } = session;
        return {
            ...catering.settings,
            name: catering.name ?? '',
        }
    });

const clientSettings = createCateringNotSettingsProcedure([RoleType.client])
    .input(getClientSettingsValidator)
    .query(async ({ ctx, input }) => {
        const { clientId } = input;
        const { db } = ctx;
        const client = await db.client.findUnique({
            where: {
                id: clientId,
            }
        });
        if (!client) {
            throw new Error('Client not found');
        }

        return {
            name: client.settings.name ?? client.name,
        }
    });

const dieticianSettings = createCateringNotSettingsProcedure([RoleType.dietician])
    .query(async ({ ctx }) => {
        const { session, db } = ctx;
        const { user } = session;
        const dietician = await db.dietician.findUnique({
            where: {
                userId: user.id,
            }
        });
        if (!dietician) {
            throw new Error('Dietician not found');
        }
        return {
            name: dietician.name,
        }
    });

const kitchenSettings = createCateringNotSettingsProcedure([RoleType.kitchen])
    .query(async ({ ctx }) => {
        const { session, db } = ctx;
        const { user } = session;
        const kitchen = await db.kitchen.findUnique({
            where: {
                userId: user.id,
            }
        });
        if (!kitchen) {
            throw new Error('Kitchen not found');
        }
        return {
            name: kitchen.name,
        }
    });

const updateManagerSettings = createCateringNotSettingsProcedure([RoleType.manager])
    .input(managerSettingsValidator)
    .mutation(({ ctx, input }) => {
        const { session, db } = ctx;
        const { catering } = session;
        const { name, firstOrderDeadline, secondOrderDeadline, phone, email, nonWorkingDays } = input;
        return db.catering.update({
            where: {
                id: catering.id
            },
            data: {
                name,
                settings: {
                    update: {
                        firstOrderDeadline,
                        secondOrderDeadline,
                        phone,
                        email,
                        nonWorkingDays,
                    }
                }
            }
        });
    });

const updateClientSettings = createCateringNotSettingsProcedure([RoleType.client])
    .input(clientSettingsValidator)
    .mutation(({ ctx, input }) => {
        const { db } = ctx;
        const { clientId } = input;
        return db.client.update({
            where: {
                id: clientId,
            },
            data: {
                name: input.name,
            }
        });
    });

const updateDieticianSettings = createCateringNotSettingsProcedure([RoleType.dietician])
    .input(dieticianSettingsValidator)
    .mutation(({ ctx, input }) => {
        const { session, db } = ctx;
        const { user } = session;
        return db.dietician.update({
            where: {
                userId: user.id,
            },
            data: {
                name: input.name,
            }
        });
    });

const updateKitchenSettings = createCateringNotSettingsProcedure([RoleType.kitchen])
    .input(kitchenSettingsValidator)
    .mutation(({ ctx, input }) => {
        const { session, db } = ctx;
        const { user } = session;
        return db.kitchen.update({
            where: {
                userId: user.id,
            },
            data: {
                name: input.name,
            }
        });
    });

const hasFinished = createRoleProcedure([RoleType.manager, RoleType.client, RoleType.superAdmin, RoleType.dietician, RoleType.kitchen])
    .query(async ({ ctx }) => {
        const { session, db } = ctx;
        const { user } = session;
        const { roleId, cateringId } = user;
        if (roleId === 'superAdmin') {
            return checkIfHasFinishedSettings({
                roleId,
                userId: user.id,
                catering: null,
            });
        }

        const catering = await db.catering.findUnique({
            where: { id: cateringId },
        });

        if (!catering) {
            throw new Error('Catering not found');
        }
        return checkIfHasFinishedSettings({
            roleId,
            userId: user.id,
            catering,
        });
    });

type PersonalizationSettings = {
    siteName: string;
    logoDark: string;
    logoLight: string;
    firstOrderDeadline: string;
    secondOrderDeadline: string;
    timeZone: string;
}

const getCateringSettings = publicProcedure
    .query(async ({ ctx }) => {
        const { session, db } = ctx;
        const settings = await getSettingsGroup('main');
        if (!session || session?.user.roleId === 'superAdmin') {
            return settings as PersonalizationSettings;
        }
        const cateringId = session?.user.cateringId;
        if (!cateringId) {
            throw new Error('Catering not found');
        }
        const cateringSettings = await db.catering.findUnique({
            where: { id: cateringId },
            select: {
                settings: true,
            }
        });
        if (!cateringSettings) {
            throw new Error('Catering not found');
        }
        const cleanedSettings = Object.fromEntries(
            Object.entries(cateringSettings.settings)
                .filter(([, value]) => value)
        );
        const personalization = {
            ...settings,
            ...cleanedSettings
        } as unknown as PersonalizationSettings;
        return personalization;
    });

const deadlines = createCateringProcedure([RoleType.client, RoleType.manager, RoleType.dietician, RoleType.kitchen])
    .input(getClientSettingsValidator)
    .query(async ({ ctx, input }) => {
        const { session } = ctx;
        const { user, catering } = session;
        const { clientId } = input;

        return getClientSettings({
            clientId,
            userId: user.id,
            cateringSettings: catering.settings,
        });
    });

const settingsRouter = {
    getForManager: managerSettings,
    getForClient: clientSettings,
    getForDietician: dieticianSettings,
    getForKitchen: kitchenSettings,
    updateByManager: updateManagerSettings,
    updateByClient: updateClientSettings,
    updateByDietician: updateDieticianSettings,
    updateByKitchen: updateKitchenSettings,
    hasFinished,
    get: getCateringSettings,
    deadlines,
};

export default settingsRouter;

