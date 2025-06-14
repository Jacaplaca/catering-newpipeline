import { RoleType } from '@prisma/client';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { db } from '@root/app/server/db';
import { getClientValidator } from '@root/app/validators/specific/client';

const getFull = createCateringProcedure([RoleType.manager, RoleType.dietician])
    .input(getClientValidator)
    .query(async ({ input, ctx }) => {
        const { session: { user: doer, catering } } = ctx;
        const { settings } = catering;
        const { firstOrderDeadline, secondOrderDeadline } = settings;
        const { id } = input;

        const client = await db.client.findUnique({
            where: { id, cateringId: doer.cateringId },
            include: {
                // tags: {
                //     include: {
                //         tag: true
                //     }
                // },
                user: {
                    select: {
                        passwordHash: false,
                        createdAt: false,
                        updatedAt: false,
                        email: false,
                        name: true
                    }
                },
                // deliveryRoute: true
            },
        });

        if (client) {
            client.info.firstOrderDeadline = client.info.firstOrderDeadline
                ? client.info.firstOrderDeadline
                : firstOrderDeadline;
            client.info.secondOrderDeadline = client.info.secondOrderDeadline
                ? client.info.secondOrderDeadline
                : secondOrderDeadline;
            return client;
        }

        return null;
    });

export default getFull;