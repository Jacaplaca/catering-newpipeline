import { createCateringProcedure, createOptionalCateringProcedure } from '@root/app/server/api/specific/trpc';
import { RoleType } from '@prisma/client';
import { getDict } from '@root/app/server/cache/translations';
import dayIdParser from '@root/app/server/api/routers/specific/libs/dayIdParser';
import returnPdfForFront from '@root/app/server/api/routers/specific/libs/pdf/returnPdfForFront';
import getDayFoodData from '@root/app/server/api/routers/specific/libs/getDayFoodData';
import { db } from '@root/app/server/db';
import getWeekDays from '@root/app/server/api/routers/specific/libs/getWeekDays';
import getFileName from '@root/app/server/api/routers/specific/libs/consumerFoods/dayMenuPdf/getFileName';
import generatePDF from '@root/app/server/api/routers/specific/libs/consumerFoods/dayMenuPdf/generate';
import { getDayMenuPdfValid } from '@root/app/validators/specific/consumerFood';
import groupDataByConsumer from '@root/app/server/api/routers/specific/libs/consumerFoods/dayMenuPdf/groupDataByConsumer';
import logger from '@root/app/lib/logger';



const dayMenuPdf = createOptionalCateringProcedure([RoleType.kitchen, RoleType.manager, RoleType.dietician, RoleType.client])
    .input(getDayMenuPdfValid)
    .query(async ({ input, ctx }) => {
        const { dayId, lang, clientId, week, perCustomer } = input;

        // User logging
        const userEmail = ctx?.session?.user?.email ?? 'Unknown (Client Link)';
        const userId = ctx?.session?.user?.id ?? 'Unknown';
        logger.info(`Generating Day Menu PDF | User: ${userEmail} (${userId}) | Day: ${dayId} | Week: ${week} | Client: ${clientId}`);

        let cateringId = null;

        if (ctx?.session?.catering) {
            cateringId = ctx.session.catering?.id ?? null;
            if (!clientId && week) {
                throw new Error('Client ID is required');
            }
        } else {
            const client = await db.client.findUnique({ where: { id: clientId } });
            cateringId = client?.cateringId ?? null;
        }

        if (!cateringId) {
            throw new Error('Catering not found');
        }

        const days = week ? getWeekDays(dayId) : [dayId];

        const allMealsData = await getDayFoodData({ dayIds: days, cateringId, ignoreOrders: true, clientId, onlyPublished: !Boolean(ctx?.session?.catering?.id) });
        const mealGroups = await db.mealGroup.findMany({ orderBy: { order: 'asc' } });
        const mealGroupOrder = mealGroups.map(mg => mg.id);

        const dictionary = await getDict({ lang, keys: ['shared', 'orders', 'menu-creator'] })
        const { year, month, day } = dayIdParser(dayId);
        const dayDate = new Date(year, month, day);

        let clientCode = ''

        if (clientId) {
            const client = await db.client.findUnique({ where: { id: clientId } });
            clientCode = client?.info.code ?? '';
            if (!client) {
                throw new Error('Client not found');
            }
        }

        try {
            if (perCustomer) {
                const groupedData = groupDataByConsumer(allMealsData);
                const fileName = getFileName({ dayDate, clientCode, isWeek: week });
                const pdfPromises = groupedData.map(({ consumer, data }) => generatePDF({
                    allMealsData: data,
                    mealGroupOrder, clientId,
                    consumer,
                    clientCode,
                    dayDate,
                    week,
                    dictionary,
                    addExtension: true
                }));
                return returnPdfForFront({ pdfPromises: Promise.all(pdfPromises), fileName });
            }
            const pdf = generatePDF({ allMealsData, mealGroupOrder, clientId, clientCode, dayDate, week, dictionary });

            // const fileName = getFileName({ dayDate, clientCode, isWeek: week });
            // return returnPdfForFront({ pdfPromises: [{ fileName, pdfPromise }], fileName });
            return returnPdfForFront(pdf);
        } catch (error) {
            const userEmail = ctx?.session?.user?.email ?? 'Unknown';
            logger.error(`Error generating Day Menu PDF | User: ${userEmail} | Error: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }

    });

export default dayMenuPdf;