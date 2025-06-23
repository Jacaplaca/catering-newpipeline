import { db } from '@root/app/server/db';

const checkIndividualMenu = async (cateringId: string, day: { year: number, month: number, day: number }, clientId: string): Promise<boolean> => {
    // Try to find a personalized (client-specific) regular menu for the given day.
    const personalizedMenu = await db.regularMenu.findFirst({
        where: {
            cateringId,
            clientId, // menu assigned specifically to this client
            day: {
                year: day.year,
                month: day.month,
                day: day.day
            }
        },
        select: { id: true }
    });

    // If we found a personalized menu, return true. Otherwise return false.
    return Boolean(personalizedMenu);
};

export default checkIndividualMenu;