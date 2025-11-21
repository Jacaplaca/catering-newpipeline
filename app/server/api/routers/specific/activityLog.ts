import { RoleType } from '@prisma/client';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';

const consumerFood = createCateringProcedure([RoleType.manager])
    .query(async ({ ctx: { db, session: { catering } } }) => {
        const now = new Date();
        // Start of previous month
        const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const logs = await db.activityLog.findMany({
            where: {
                cateringId: catering.id,
                createdAt: {
                    gte: startOfPreviousMonth,
                },
                userId: {
                    not: null,
                }
            },
            include: {
                user: {
                    select: {
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Grouping: Date -> Action -> UserEmail -> Count
        const grouped: Record<string, Record<string, Record<string, number>>> = {};

        logs.forEach((log) => {
            const date = log.createdAt.toISOString().split('T')[0];
            const action = log.action;
            const email = log.user?.email;

            if (!email || !date) return;

            if (!grouped[date]) {
                grouped[date] = {};
            }

            const dayGroup = grouped[date];
            // Ensure dayGroup is defined (TS check)
            if (!dayGroup) return;

            if (!dayGroup[action]) {
                dayGroup[action] = {};
            }

            const actionGroup = dayGroup[action];
            // Ensure actionGroup is defined (TS check)
            if (!actionGroup) return;

            if (!actionGroup[email]) {
                actionGroup[email] = 0;
            }
            actionGroup[email]++;
        });

        // Transform to list structure
        const result = Object.entries(grouped).map(([date, actions]) => ({
            date,
            actions: Object.entries(actions).map(([action, users]) => ({
                action,
                users: Object.entries(users).map(([email, count]) => ({
                    email,
                    count,
                })),
            })),
        }));

        // Sort by date descending
        return result.sort((a, b) => b.date.localeCompare(a.date));
    });


const activityLogRouter = {
    consumerFood,
};

export default activityLogRouter;
