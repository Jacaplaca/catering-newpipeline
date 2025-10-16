

import { db } from '@root/app/server/db';
import { getClientValidator } from '@root/app/validators/specific/client';
import { publicProcedure } from '@root/app/server/api/trpc';
import { type RoleType } from '@prisma/client';

export type UserPublicData = {
    name: string,
    role: RoleType & 'consumer',
}

const getPublic = publicProcedure
    .input(getClientValidator)
    .query(async ({ input }) => {
        const { id } = input;

        const client = await db.client.findUnique({
            where: {
                id,
            },
        });

        if (client) {
            return {
                name: client?.info?.name ?? '',
                role: 'client',
            } as UserPublicData
        }

        const consumer = await db.consumer.findUnique({
            where: {
                id,
            },
        });

        if (consumer) {
            return {
                name: consumer?.name ?? '',
                role: 'consumer',
            } as UserPublicData
        }

        return null;

    });

const publicDataRouter = {
    get: getPublic,
}

export default publicDataRouter;