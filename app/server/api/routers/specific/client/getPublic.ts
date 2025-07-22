import { db } from '@root/app/server/db';
import { getClientValidator } from '@root/app/validators/specific/client';
import { publicProcedure } from '@root/app/server/api/trpc';

const getPublic = publicProcedure
    .input(getClientValidator)
    .query(async ({ input }) => {
        const { id } = input;

        const client = await db.client.findUnique({
            where: {
                id,
            },
        });

        return client?.info?.name ?? '';
    });

export default getPublic;