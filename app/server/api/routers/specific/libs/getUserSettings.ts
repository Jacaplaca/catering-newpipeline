import { type Catering } from '@prisma/client';
import { db } from '@root/app/server/db';

const getClientSettings = async ({ clientId, userId, cateringSettings }: {
    clientId?: string;
    userId: string;
    cateringSettings: Catering['settings'];
}) => {
    const where = {
        id: clientId,
        ...(userId && { userId }),
    }

    const client = clientId ? await db.client.findUnique({
        where,
    }) : null;

    const settings = {
        firstOrderDeadline: client?.info.firstOrderDeadline ? client.info.firstOrderDeadline : cateringSettings.firstOrderDeadline,
        secondOrderDeadline: client?.info.secondOrderDeadline ? client.info.secondOrderDeadline : cateringSettings.secondOrderDeadline,
        allowWeekendOrder: Boolean(client?.info.allowWeekendOrder),
        timeZone: cateringSettings.timeZone,
        nonWorkingDays: cateringSettings.nonWorkingDays,
    }

    return settings;
}

export default getClientSettings;
