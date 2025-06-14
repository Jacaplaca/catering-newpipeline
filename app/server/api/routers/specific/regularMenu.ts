import { db } from '@root/app/server/db';
import { type Prisma, RoleType } from '@prisma/client';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { regularMenuCreateValidator, regularMenuEditValidator, regularMenuGetOneValidator, regularMenuRemoveValidator, regularMenuListValidator } from '@root/app/validators/specific/regularMenu';
import { type RegularMenuCustomObject } from '@root/types/specific';
import { TRPCError } from '@trpc/server';

const addFoodToConsumers = async (
  tx: Prisma.TransactionClient,
  cateringId: string,
  regularMenuId: string,
  foods: { id: string; mealId: string }[],
) => {
  const consumersResult = await tx.consumer.aggregateRaw({
    pipeline: [
      {
        $match: {
          cateringId,
          $or: [{ deactivated: false }, { deactivated: null }],
        },
      },
      {
        $project: {
          id: { $toString: '$_id' },
          _id: 0,
        },
      },
    ],
  });

  const consumers = consumersResult as unknown as { id: string }[];

  if (consumers.length === 0) return;

  const consumerFoodsToCreate: Prisma.ConsumerFoodCreateManyInput[] = [];

  for (const food of foods) {
    for (const consumer of consumers) {
      consumerFoodsToCreate.push({
        cateringId,
        regularMenuId,
        consumerId: consumer.id,
        foodId: food.id,
        mealId: food.mealId,
      });
    }
  }

  if (consumerFoodsToCreate.length > 0) {
    await tx.consumerFood.createMany({
      data: consumerFoodsToCreate,
    });
  }
};

const create = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(regularMenuCreateValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { day, foods } = input;

    return db.$transaction(async (tx) => {
      const regularMenu = await tx.regularMenu.create({
        data: {
          day,
          catering: {
            connect: { id: catering.id },
          },
        },
      });

      await addFoodToConsumers(tx, catering.id, regularMenu.id, foods);

      return regularMenu;
    });
  });

const getOne = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(regularMenuGetOneValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { day } = input;

    if (!day) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Day is required',
      });
    }

    const pipeline: Prisma.InputJsonValue[] = [
      {
        $match: {
          cateringId: catering.id,
          'day.year': day.year,
          'day.month': day.month,
          'day.day': day.day,
        },
      },
      { $limit: 1 },
      {
        $lookup: {
          from: 'ConsumerFood',
          localField: '_id',
          foreignField: 'regularMenuId',
          pipeline: [
            {
              $lookup: {
                from: 'Food',
                localField: 'foodId',
                foreignField: '_id',
                as: 'food',
              },
            },
            { $unwind: '$food' },
            {
              $lookup: {
                from: 'Meal',
                localField: 'mealId',
                foreignField: '_id',
                as: 'meal',
              },
            },
            {
              $lookup: {
                from: 'FoodAllergen',
                localField: 'food._id',
                foreignField: 'foodId',
                as: 'foodAllergens',
              },
            },
            {
              $lookup: {
                from: 'Allergen',
                localField: 'foodAllergens.allergenId',
                foreignField: '_id',
                as: 'allergenDetails',
              },
            },
            {
              $project: {
                _id: 0,
                id: { $toString: '$food._id' },
                name: '$food.name',
                ingredients: '$food.ingredients',
                mealId: {
                  $cond: {
                    if: { $gt: [{ $size: '$meal' }, 0] },
                    then: { $toString: { $arrayElemAt: ['$meal._id', 0] } },
                    else: null
                  }
                },
                allergens: {
                  $map: {
                    input: '$allergenDetails',
                    as: 'allergen',
                    in: {
                      id: { $toString: '$$allergen._id' },
                      name: '$$allergen.name',
                    },
                  },
                },
              },
            },
            {
              $group: {
                _id: '$id',
                id: { $first: '$id' },
                name: { $first: '$name' },
                ingredients: { $first: '$ingredients' },
                mealId: { $first: '$mealId' },
                allergens: { $first: '$allergens' },
              },
            },
          ],
          as: 'foods',
        },
      },
      {
        $project: {
          _id: 0,
          id: { $toString: '$_id' },
          day: '$day',
          foods: '$foods',
        },
      },
    ];

    const result = await db.regularMenu.aggregateRaw({ pipeline });

    if (!Array.isArray(result) || result.length === 0) {
      return null;
    }

    return result[0] as unknown as RegularMenuCustomObject;
  });

const update = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(regularMenuEditValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { id, day, foods } = input;

    return db.$transaction(async (tx) => {
      const menu = await tx.regularMenu.findFirst({
        where: {
          id,
          cateringId: catering.id,
        },
      });

      if (!menu) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Menu not found or you do not have permission to edit it.',
        });
      }

      // Remove existing consumer foods for this menu
      await tx.consumerFood.deleteMany({
        where: { regularMenuId: id }
      });

      // Update the menu
      const regularMenu = await tx.regularMenu.update({
        where: { id },
        data: { day },
      });

      // Add new foods to consumers
      await addFoodToConsumers(tx, catering.id, id, foods);

      return regularMenu;
    });
  });

const remove = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(regularMenuRemoveValidator)
  .mutation(({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { ids } = input;

    return null;
  });

const getInfinite = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(regularMenuListValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { cursor, limit, searchValue } = input;
    const skip = cursor ?? 0;

    const basePipeline: Prisma.InputJsonValue[] = [{ $match: { cateringId: catering.id } }];

    if (searchValue) {
      const escapedSearchValue = searchValue.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      basePipeline.push({
        $match: {
          $expr: {
            $regexMatch: {
              input: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: {
                    $dateFromParts: {
                      year: '$day.year',
                      month: { $add: ['$day.month', 1] },
                      day: '$day.day',
                    },
                  },
                },
              },
              regex: escapedSearchValue,
              options: 'i',
            },
          },
        },
      });
    }

    const dataPipeline: Prisma.InputJsonValue[] = [
      ...basePipeline,
      { $sort: { 'day.year': -1, 'day.month': -1, 'day.day': -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          id: { $toString: '$_id' },
          name: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: {
                $dateFromParts: {
                  year: '$day.year',
                  month: { $add: ['$day.month', 1] },
                  day: '$day.day',
                },
              },
            },
          },
          _id: 0,
        },
      },
    ];

    const countPipeline: Prisma.InputJsonValue[] = [...basePipeline, { $count: 'count' }];

    const [items, totalCountObj] = await Promise.all([
      db.regularMenu.aggregateRaw({
        pipeline: dataPipeline,
      }) as unknown as { id: string; name: string }[],
      db.regularMenu.aggregateRaw({
        pipeline: countPipeline,
      }) as unknown as { count: number }[],
    ]);

    const totalCount = totalCountObj[0]?.count ?? 0;
    const nextCursor = skip + limit < totalCount ? skip + limit : undefined;

    return {
      items,
      nextCursor,
      totalCount,
    };
  });

const regularRouter = {
  // getMany,
  create,
  getOne,
  update,
  remove,
  getInfinite,
  // count,
}

export default regularRouter;



