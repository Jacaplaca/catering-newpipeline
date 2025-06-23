import { db } from '@root/app/server/db';
import { s3deleteKeys } from '@root/app/server/s3/delete';

const getClientS3Keys = async (clientId: string) => {
    const clientFiles = await db.clientFile.findMany({
        where: {
            clientId
        },
        select: {
            s3Key: true
        }
    });
    return clientFiles.map((file) => file.s3Key);
}

const removeClientFiles = async (s3Keys: string[]) => {
    if (s3Keys.length === 0) return;

    const usedKeys = await db.clientFile.groupBy({
        by: ['s3Key'],
        where: {
            s3Key: { in: s3Keys }
        },
        _count: {
            s3Key: true
        }
    });

    const usedKeysSet = new Set(
        usedKeys
            .filter(k => k._count.s3Key > 1)
            .map(k => k.s3Key)
    );

    const s3KeysToDelete = s3Keys.filter(key => !usedKeysSet.has(key));

    if (s3KeysToDelete.length > 0) {
        await s3deleteKeys(s3KeysToDelete);
    }
}

type RemoveClientsParams = {
    clientsIds: string[];
    cateringId?: string;
    forceRemove?: boolean;
}

const removeClients = async ({
    clientsIds,
    cateringId,
    forceRemove = false
}: RemoveClientsParams): Promise<{ success: boolean }> => {
    return await db.$transaction(async (tx) => {
        for (const clientId of clientsIds) {
            const hasOrder = await tx.order.findFirst({
                where: cateringId
                    ? { clientId, cateringId }
                    : { clientId }
            });

            if (hasOrder && !forceRemove) {
                await tx.client.update({
                    where: { id: clientId },
                    data: { deactivated: true }
                });
            } else {
                // const client = await tx.client.findUnique({
                //     where: { id: clientId },
                //     select: { userId: true }
                // });

                // TODO: works with removeClientFiles
                // const clientFiles = await getClientS3Keys(clientId);

                await tx.regularMenu.deleteMany({
                    where: {
                        clientId
                    }
                });

                await tx.client.delete({
                    where: { id: clientId }
                });

                // TODO: decide if we want to delete users, but user can have multiple clients
                // if (client?.userId) {
                //     await tx.user.delete({
                //         where: { id: client.userId }
                //     });
                // }

                // TODO: bring back on production
                // await removeClientFiles(clientFiles);
            }
        }
        return { success: true };
    });
}

export default removeClients;
