import { RoleType } from '@prisma/client';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';

const paymentReminder = createCateringProcedure([RoleType.manager])
    .query(({ ctx: { db, session: { catering } } }) => {
        return db.paymentReminder.findFirst({
            where: { cateringId: catering.id, isPublished: true },
            orderBy: { dueDate: 'asc' },
        });
    });

export default paymentReminder;