import { type Prisma } from '@prisma/client';

const getOriginalMenu = async (tx: Prisma.TransactionClient, cateringId: string, day: { year: number, month: number, day: number }) => {
    return await tx.regularMenu.findFirst({
        where: {
            cateringId,
            day: {
                year: day.year,
                month: day.month,
                day: day.day,
            },
            clientId: undefined,
        },
    });
};

export default getOriginalMenu;