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

const getManyClients = async (input: z.infer<typeof clientsValidator> | z.infer<typeof getClientsWithCommonAllergensValidator>, catering: Catering): Promise<ClientCustomTable[]> => {
    const { page, limit, sortName, sortDirection, searchValue, showColumns, tagId } = input;

    const pagination = getQueryPagination({ page, limit });

    const allowedSortNames = clientSortNames;

    const orderBy = getQueryOrder({
        name: sortName,
        direction: sortDirection,
        allowedNames: allowedSortNames,
        inNumbers: true
    });

    const pipeline = [
        ...getClientsDbQuery({ searchValue, showColumns, catering, tagId }),
        ...getLowerCaseSort(orderBy),
        { $skip: pagination.skip },
        { $limit: pagination.take },
    ]

    const result = await db.client.aggregateRaw({
        pipeline,
        options
    });

    return result as unknown as ClientCustomTable[];
};

export default getManyClients;

