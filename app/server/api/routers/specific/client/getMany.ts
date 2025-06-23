import { RoleType } from '@prisma/client';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { getClients as clientsValidator } from '@root/app/validators/specific/client';
import getManyClients from '@root/app/server/api/routers/specific/libs/getManyClients';

const getMany = createCateringProcedure([RoleType.manager, RoleType.dietician])
    .input(clientsValidator)
    .query(({ input, ctx }) => {
        const { session: { catering } } = ctx;
        return getManyClients(input, catering);
    });

export default getMany;