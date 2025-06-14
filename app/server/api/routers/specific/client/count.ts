import { RoleType } from '@prisma/client';
import getClientsDbQuery from '@root/app/server/api/routers/specific/libs/getClientsDbQuery';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { db } from '@root/app/server/db';
import { getClientsCount as countValidator } from '@root/app/validators/specific/client';

const count = createCateringProcedure([RoleType.manager, RoleType.dietician])
    .input(countValidator)
    .query(async ({ input, ctx }) => {
        const { session: { catering } } = ctx;
        const { searchValue, showColumns, tagId } = input;

        const count = await db.client.aggregateRaw({
            pipeline: [
                ...getClientsDbQuery({ searchValue, showColumns, catering, tagId }),
                { $count: 'count' },
            ]
        }) as unknown as { count: number }[];
        return count[0]?.count ?? 0;
    });

export default count;
