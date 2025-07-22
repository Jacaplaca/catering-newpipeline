// import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { db } from '@root/app/server/db';
// import { RoleType } from '@prisma/client';
import getDaysOfWeeks from '@root/app/specific/lib/getDaysOfWeeks';
import dateToWeek from '@root/app/specific/lib/dateToWeek';
import { filesForClient } from '@root/app/validators/specific/clientFiles';
import { publicProcedure } from '@root/app/server/api/trpc';

const asClient = publicProcedure
    .input(filesForClient)
    .query(async ({ input }) => {
        // const { session: { catering } } = ctx;
        const { clientId } = input;

        if (!clientId) {
            throw new Error("Brak ID klienta");
        }

        const daysOfWeeks = getDaysOfWeeks('wednesday');

        const weeks = daysOfWeeks.map((day) => {
            return dateToWeek(day);
        })

        return db.clientFile.findMany({
            where: {
                clientId,
                // cateringId: catering.id,
                week: {
                    is: {
                        OR: weeks.map(week => ({
                            year: week.weekYear,
                            week: week.week
                        }))
                    }
                }
            }
        });
    });

export default asClient;
