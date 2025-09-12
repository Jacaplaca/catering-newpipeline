import { type Prisma } from '@prisma/client';

const getClientsWithMenus = async (tx: Prisma.TransactionClient, cateringId: string) => {
    return await tx.regularMenu.findMany({
        where: {
            cateringId,
            clientId: { not: null },
        },
        select: {
            clientId: true,
        },
    }) as unknown as { clientId: string }[];
}


const getConsumers = async (tx: Prisma.TransactionClient, { cateringId, clientId, update, consumerIds }: { cateringId: string, clientId?: string | null, update?: boolean, consumerIds?: string[] }) => {

    const matchCondition: {
        cateringId: string;
        $or: { deactivated: boolean | null }[];
        clientId?: string | { $nin: string[] };
        _id?: { $in: string[] };
    } = {
        cateringId,
        $or: [{ deactivated: false }, { deactivated: null }],
    }

    if (clientId) {
        matchCondition.clientId = clientId;
    }

    if (!clientId && update) {
        const clientsWithMenus = await getClientsWithMenus(tx, cateringId);
        matchCondition.clientId = { $nin: clientsWithMenus.map(c => c.clientId) };
    }

    if (consumerIds) {
        matchCondition._id = { $in: consumerIds };
    }

    return await tx.consumer.aggregateRaw({
        pipeline: [
            {
                $match: matchCondition,
            },
            {
                $project: {
                    id: { $toString: '$_id' },
                    clientId: 1,
                    _id: 0,
                },
            },
        ],
    }) as unknown as { id: string, clientId: string }[];
};

export default getConsumers;