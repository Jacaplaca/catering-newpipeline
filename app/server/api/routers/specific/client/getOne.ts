import getClientsDbQuery from '@root/app/server/api/routers/specific/libs/getClientsDbQuery';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { db } from '@root/app/server/db';
import { getClientValidator } from '@root/app/validators/specific/client';
import { type ClientCustomTable } from '@root/types/specific';
import { RoleType } from '@prisma/client';

const getOne = createCateringProcedure([RoleType.manager, RoleType.dietician])
    .input(getClientValidator)
    .query(async ({ input, ctx }) => {
        const { session: { catering } } = ctx;
        const { id } = input;

        const results = await db.client.aggregateRaw({
            pipeline: [
                ...getClientsDbQuery({ id, showColumns: [], catering }),
            ]
        }) as unknown as ClientCustomTable[];

        return results[0];
    });

export default getOne;