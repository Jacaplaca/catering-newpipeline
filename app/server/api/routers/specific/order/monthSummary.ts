import { RoleType } from '@prisma/client';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { db } from '@root/app/server/db';
import validateDeliveryMonth from '@root/app/server/lib/validateDeliveryMonth';
import { monthSummaryValid } from '@root/app/validators/specific/order';

const monthSummary = createCateringProcedure([RoleType.client, RoleType.manager])
    .input(monthSummaryValid)
    .query(async ({ ctx, input }) => {
        const { session: { catering } } = ctx;
        const cateringId = catering.id;
        const { deliveryMonth } = input;

        const [year, month] = validateDeliveryMonth(deliveryMonth);

        const aggregationPipeline = [
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
                    _id: null,
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
                    totalOrders: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
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
                    totalOrders: 1,
                    totalMeals: {
                        $add: [
                            '$breakfastStandard',
                            '$lunchStandard',
                            '$dinnerStandard',
                            '$breakfastDiet',
                            '$lunchDiet',
                            '$dinnerDiet'
                        ]
                    }
                }
            }
        ];

        const aggregatedResult = await db.order.aggregateRaw({ pipeline: aggregationPipeline });

        const result = aggregatedResult[0] ?? {
            breakfastStandard: 0,
            lunchStandard: 0,
            dinnerStandard: 0,
            breakfastDiet: 0,
            lunchDiet: 0,
            dinnerDiet: 0,
            lunchStandardBeforeDeadline: 0,
            dinnerStandardBeforeDeadline: 0,
            lunchDietCountBeforeDeadline: 0,
            dinnerDietCountBeforeDeadline: 0,
            totalOrders: 0,
            totalMeals: 0
        };

        return result as {
            breakfastStandard: number;
            lunchStandard: number;
            dinnerStandard: number;
            breakfastDiet: number;
            lunchDiet: number;
            dinnerDiet: number;
            lunchStandardBeforeDeadline: number;
            dinnerStandardBeforeDeadline: number;
            lunchDietCountBeforeDeadline: number;
            dinnerDietCountBeforeDeadline: number;
            totalOrders: number;
            totalMeals: number;
        };
    });

export default monthSummary;
