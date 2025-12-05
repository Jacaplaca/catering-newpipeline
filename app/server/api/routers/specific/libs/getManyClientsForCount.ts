import { type Catering } from '@prisma/client';
import getLowerCaseSort from '@root/app/lib/lower-case-sort-pipeline';
import { getQueryOrder, getQueryPagination } from '@root/app/lib/safeDbQuery';
import getClientsDbQuery from '@root/app/server/api/routers/specific/libs/getClientsDbQuery';
import { db } from '@root/app/server/db';
import { type getClients as clientsValidator } from '@root/app/validators/specific/client';
import { type ClientCustomTable, clientSortNames } from '@root/types/specific';
import { options } from '@root/app/server/api/specific/aggregate';
import { type z } from 'zod';
import { type getClientsWithCommonAllergensValidator } from '@root/app/validators/specific/regularMenu';

const getManyClientsForCount = async (
    input: z.infer<typeof clientsValidator> | z.infer<typeof getClientsWithCommonAllergensValidator>,
    catering: Catering,
    config?: { allowedClientIds?: string[] }
): Promise<string[]> => {
    const { searchValue, showColumns, tagId } = input;
    const { allowedClientIds } = config ?? {};

    const pipeline = [
        ...getClientsDbQuery({ searchValue, showColumns, catering, tagId, allowedClientIds }),
    ]

    const result = await db.client.aggregateRaw({
        pipeline,
        options
    }) as unknown as { id: string }[];

    return result.map((item) => item.id);

};

export default getManyClientsForCount;

