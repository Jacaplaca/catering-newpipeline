import getLowerCaseSort from '@root/app/lib/lower-case-sort-pipeline';
import { getQueryOrder, getQueryPagination } from '@root/app/lib/safeDbQuery';
import getClientsDbQuery from '@root/app/server/api/routers/specific/libs/getClientsDbQuery';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { db } from '@root/app/server/db';
import { getClients as clientsValidator } from '@root/app/validators/specific/client';
import { type ClientCustomTable, clientSortNames } from '@root/types/specific';
import { options } from '@root/app/server/api/specific/aggregate';
import { RoleType } from '@prisma/client';

const getMany = createCateringProcedure([RoleType.manager, RoleType.dietician])
    .input(clientsValidator)
    .query(({ input, ctx }) => {
        const { session: { catering } } = ctx;
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

        return db.client.aggregateRaw({
            pipeline,
            options
        }) as unknown as ClientCustomTable[];
    });

export default getMany;