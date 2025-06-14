import { db } from '@root/app/server/db';
import { getQueryPagination } from '@root/app/lib/safeDbQuery';
import { getDayValid, getOrdersGroupedByDayValid } from '@root/app/validators/specific/order';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import type { OrderGroupedByDayCustomTable } from '@root/types/specific';
import { RoleType } from '@prisma/client';
import processMeals from '@root/app/server/api/routers/specific/libs/processMeals';
import groupStandardOrdersByDay from '@root/app/server/api/routers/specific/libs/groupStandardOrdersByDay';
import getDayOrders from '@root/app/server/api/routers/specific/libs/getDayOrders';

const day = createCateringProcedure([RoleType.manager, RoleType.kitchen, RoleType.dietician])
    .input(getDayValid)
    .query(async ({ input, ctx }) => {
        const { session: { catering } } = ctx;
        const { dayId } = input;

        const dayData = await getDayOrders(dayId, catering.id);
        const sortedStandard = groupStandardOrdersByDay(dayData);

        const summary = dayData.reduce((acc, {
            breakfastStandard,
            lunchStandard,
            dinnerStandard,
        }) => {
            acc.breakfastStandard += breakfastStandard;
            acc.lunchStandard += lunchStandard;
            acc.dinnerStandard += dinnerStandard;
            return acc;
        }, {
            breakfastStandard: 0,
            lunchStandard: 0,
            dinnerStandard: 0,
        })

        const diet = dayData.reduce((acc, {
            client,
            breakfastDiet,
            lunchDiet,
            dinnerDiet,
        }) => {
            const code = client?.info?.code;
            if (code) {
                acc.breakfast[code] = processMeals(breakfastDiet);
                acc.lunch[code] = processMeals(lunchDiet);
                acc.dinner[code] = processMeals(dinnerDiet);
            }
            return acc;
        }, {
            breakfast: {} as Record<string, Record<string, { code: string, description: string }>>,
            lunch: {} as Record<string, Record<string, { code: string, description: string }>>,
            dinner: {} as Record<string, Record<string, { code: string, description: string }>>,
        })

        const dayDataCleaned = dayData.map(({
            breakfastDiet: _breakfastDiet,
            lunchDiet: _lunchDiet,
            dinnerDiet: _dinnerDiet,
            ...rest
        }) => rest);

        return { dayData: dayDataCleaned, summary, standard: sortedStandard, diet };
    });

const table = createCateringProcedure([RoleType.manager, RoleType.kitchen, RoleType.dietician])
    .input(getOrdersGroupedByDayValid)
    .query(async ({ input, ctx }) => {
        const { session: { catering } } = ctx;
        const { page, limit, sortDirection } = input;

        const pagination = getQueryPagination({ page, limit });


        const groupedOrders = await db.order.aggregateRaw({
            pipeline: [
                {
                    $match: {
                        cateringId: catering.id,
                        status: { $ne: 'draft' }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: '$deliveryDay.year',
                            month: '$deliveryDay.month',
                            day: '$deliveryDay.day'
                        },
                        breakfastStandard: { $sum: '$breakfastStandard' },
                        lunchStandard: { $sum: '$lunchStandard' },
                        dinnerStandard: { $sum: '$dinnerStandard' },
                        breakfastDietCount: { $sum: '$breakfastDietCount' },
                        lunchDietCount: { $sum: '$lunchDietCount' },
                        dinnerDietCount: { $sum: '$dinnerDietCount' },
                        lunchStandardBeforeDeadline: { $sum: '$lunchStandardBeforeDeadline' },
                        dinnerStandardBeforeDeadline: { $sum: '$dinnerStandardBeforeDeadline' },
                        lunchDietCountBeforeDeadline: { $sum: '$lunchDietCountBeforeDeadline' },
                        dinnerDietCountBeforeDeadline: { $sum: '$dinnerDietCountBeforeDeadline' },
                        sentToCateringAt: { $max: '$sentToCateringAt' }
                    }
                },
                {
                    $addFields: {
                        id: {
                            $concat: [
                                { $toString: "$_id.year" },
                                "-",
                                { $toString: "$_id.month" },
                                "-",
                                { $toString: "$_id.day" }
                            ]
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        id: 1,
                        deliveryDay: {
                            year: '$_id.year',
                            month: '$_id.month',
                            day: '$_id.day'
                        },
                        breakfastStandard: 1,
                        lunchStandard: 1,
                        dinnerStandard: 1,
                        breakfastDietCount: 1,
                        lunchDietCount: 1,
                        dinnerDietCount: 1,
                        lunchStandardBeforeDeadline: 1,
                        dinnerStandardBeforeDeadline: 1,
                        lunchDietCountBeforeDeadline: 1,
                        dinnerDietCountBeforeDeadline: 1,
                        sentToCateringAt: 1
                    }
                },
                {
                    $addFields: {
                        sortDate: {
                            $dateFromParts: {
                                year: "$deliveryDay.year",
                                month: { $add: ["$deliveryDay.month", 1] },
                                day: "$deliveryDay.day"
                            }
                        }
                    }
                },
                {
                    $sort: {
                        sortDate: sortDirection === 'asc' ? 1 : -1
                    }
                },
                {
                    $project: {
                        sortDate: 0
                    }
                },
                { $skip: pagination.skip },
                { $limit: pagination.take }
            ]
        });

        return groupedOrders as unknown as OrderGroupedByDayCustomTable[];
    });

const count = createCateringProcedure([RoleType.manager, RoleType.kitchen, RoleType.dietician])
    .query(async ({ ctx }) => {
        const { session: { catering } } = ctx;

        const result = await db.order.aggregateRaw({
            pipeline: [
                {
                    $match: {
                        cateringId: catering.id,
                        status: { $ne: 'draft' }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: '$deliveryDay.year',
                            month: '$deliveryDay.month',
                            day: '$deliveryDay.day'
                        }
                    }
                },
                {
                    $count: 'count'
                }
            ]
        }) as unknown as { count: number }[];

        return result[0]?.count ?? 0;
    });

const getTable = {
    day,
    table,
    count,
};


export default getTable;