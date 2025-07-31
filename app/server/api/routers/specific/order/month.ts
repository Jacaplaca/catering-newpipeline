import { RoleType } from '@prisma/client';
import { getQueryPagination } from '@root/app/lib/safeDbQuery';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { db } from '@root/app/server/db';
import validateDeliveryMonth from '@root/app/server/lib/validateDeliveryMonth';
import { monthAllClientsValid } from '@root/app/validators/specific/order';
import type { OrderGroupedByClientAndMonthCustomTable } from '@root/types/specific';


const count = createCateringProcedure([RoleType.manager, RoleType.dietician])
    .input(monthAllClientsValid.pick({ deliveryMonth: true }))
    .query(async ({ ctx, input }) => {
        const { session: { catering } } = ctx;
        const cateringId = catering.id;
        const { deliveryMonth } = input;

        const [year, month] = validateDeliveryMonth(deliveryMonth);

        const countPipeline = [
            {
                $match: {
                    cateringId: cateringId,
                    'deliveryDay.year': year,
                    'deliveryDay.month': month - 1,
                    status: { $ne: 'draft' }
                }
            },
            {
                $group: {
                    _id: '$clientId',
                }
            },
            {
                $count: 'count'
            }
        ];

        const countResult = await db.order.aggregateRaw({
            pipeline: countPipeline
        }) as unknown as { count: number }[];

        return countResult[0]?.count ?? 0
    });

const table = createCateringProcedure([RoleType.manager, RoleType.dietician])
    .input(monthAllClientsValid)
    .query(async ({ ctx, input }) => {
        const { session: { catering } } = ctx;
        const cateringId = catering.id;
        const { deliveryMonth, limit, page, sortName, sortDirection } = input;

        const [year, month] = validateDeliveryMonth(deliveryMonth);
        const pagination = getQueryPagination({ page, limit });

        // const sortFieldMap: Record<typeof sortName, string> = {
        //     // clientCode: 'client.info.code',
        //     clientName: 'client.info.name'
        // };
        // const sortField = sortFieldMap[sortName] ?? 'client.info.name';

        const commonMatchStage = {
            $match: {
                cateringId: cateringId,
                'deliveryDay.year': year,
                'deliveryDay.month': month - 1,
                status: { $ne: 'draft' }
            }
        };

        const aggregationPipeline = [
            commonMatchStage,
            {
                $group: {
                    _id: '$clientId',
                    breakfastStandard: { $sum: '$breakfastStandard' },
                    lunchStandard: { $sum: '$lunchStandard' },
                    dinnerStandard: { $sum: '$dinnerStandard' },
                    breakfastDiet: { $sum: '$breakfastDietCount' },
                    lunchDiet: { $sum: '$lunchDietCount' },
                    dinnerDiet: { $sum: '$dinnerDietCount' },
                    lunchStandardBeforeDeadline: { $sum: '$lunchStandardBeforeDeadline' },
                    dinnerStandardBeforeDeadline: { $sum: '$dinnerStandardBeforeDeadline' },
                    lunchDietCountBeforeDeadline: { $sum: '$lunchDietCountBeforeDeadline' },
                    dinnerDietCountBeforeDeadline: { $sum: '$dinnerDietCountBeforeDeadline' },
                }
            },
            {
                $lookup: {
                    from: 'Client',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'clientInfo'
                }
            },
            {
                $unwind: '$clientInfo'
            },
            {
                $project: {
                    id: '$clientInfo._id',
                    clientId: '$_id',
                    client: '$clientInfo',
                    breakfastStandard: 1,
                    lunchStandard: 1,
                    dinnerStandard: 1,
                    breakfastDiet: 1,
                    lunchDiet: 1,
                    dinnerDiet: 1,
                    lunchStandardBeforeDeadline: 1,
                    dinnerStandardBeforeDeadline: 1,
                    lunchDietCountBeforeDeadline: 1,
                    dinnerDietCountBeforeDeadline: 1,
                }
            },
            {
                $sort: {
                    [sortName]: sortDirection === 'asc' ? 1 : -1
                }
            },
            { $skip: pagination.skip },
            { $limit: pagination.take }
        ];

        const aggregatedOrdersResult = await db.order.aggregateRaw({ pipeline: aggregationPipeline });

        return aggregatedOrdersResult as unknown as OrderGroupedByClientAndMonthCustomTable[]

    });

const endpoints = {
    table,
    count
}

export default endpoints;
