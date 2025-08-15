import { db } from '@root/app/server/db';
import { type MealCategory, RoleType } from '@prisma/client';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { getQueryOrder } from '@root/app/lib/safeDbQuery';
import { getQueryPagination } from '@root/app/lib/safeDbQuery';
import { foodCategorySortNames } from '@root/types/specific';
import getLowerCaseSort from '@root/app/lib/lower-case-sort-pipeline';
import { options } from '@root/app/server/api/specific/aggregate';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { mealCategoryCreateValidator, mealCategoryEditValidator, mealCategoryGetManyByIdsValidator, mealCategoryGetOneValidator, mealCategoryListValidator, getMealCategoriesValidator, removeMealCategoryValidator } from '@root/app/validators/specific/mealCategory';
import getMealCategoryDbQuery from '@root/app/server/api/routers/specific/libs/getMealCategoryDbQuery';

const checkUnique = async (name: string, cateringId: string) => {
  const mealCategory = await db.mealCategory.findFirst({
    where: {
      name,
      cateringId,
    },
  });

  if (mealCategory) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'meals:duplicate_meal_category_name_error' });
  }
}


const getMany = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(getMealCategoriesValidator)
  .query(({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { page, limit, sortName, sortDirection } = input;

    const pagination = getQueryPagination({ page, limit });

    const allowedSortNames = foodCategorySortNames;

    const orderBy = getQueryOrder({
      name: sortName,
      direction: sortDirection,
      allowedNames: allowedSortNames,
      inNumbers: true
    });

    const pipeline = [
      ...getMealCategoryDbQuery({ catering }),
      ...getLowerCaseSort(orderBy),
      { $skip: pagination.skip },
      { $limit: pagination.take },
    ]

    return db.mealCategory.aggregateRaw({
      pipeline,
      options
    }) as unknown as MealCategory[];
  });

const count = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(z.object({}))
  .query(async ({ ctx }) => {
    const { session: { catering } } = ctx;

    const count = await db.mealCategory.count({
      where: {
        cateringId: catering.id,
      }
    });

    return count;
  });


const create = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(mealCategoryCreateValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { name } = input;

    await checkUnique(name, catering.id);

    const mealCategory = await db.mealCategory.create({
      data: {
        name,
        cateringId: catering.id,
      }
    })

    return mealCategory;
  });

const getOne = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(mealCategoryGetOneValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { id } = input;

    const foodCategory = await db.foodCategory.findUnique({
      where: {
        id,
        cateringId: catering.id,
      }
    });

    if (!foodCategory) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'meals:meal_category_not_found' });
    }

    return foodCategory;
  });

const getManyByIds = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(mealCategoryGetManyByIdsValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { ids } = input;

    const mealCategories = await db.mealCategory.findMany({
      where: {
        id: { in: ids },
        cateringId: catering.id,
      }
    });

    return mealCategories;
  });

const update = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(mealCategoryEditValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { id, name } = input;

    await checkUnique(name, catering.id);

    const mealCategory = await db.mealCategory.update({
      where: {
        id,
        cateringId: catering.id,
      },
      data: {
        name,
      }
    });

    return mealCategory;
  });

const remove = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(removeMealCategoryValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { ids } = input;

    const mealCategories = await db.mealCategory.deleteMany({
      where: {
        id: { in: ids },
        cateringId: catering.id,
      }
    });

    return mealCategories;
  });

const getInfinite = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(mealCategoryListValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { cursor, limit, searchValue } = input;
    const skip = cursor ?? 0;

    const pipeFragment = [
      {
        $match: {
          $or: [
            {
              "name": {
                $type: "string",
                $regex: searchValue,
                $options: "i"
              }
            },
          ]
        }
      },
      ...getMealCategoryDbQuery({ catering })
    ]

    const pipelineData = [
      ...pipeFragment,
      ...getLowerCaseSort({ "name": 1 }),
      { $addFields: { name: "$name" } },
      { $skip: skip },
      { $limit: limit },
    ]

    const pipelineCount = [
      ...pipeFragment,
      { $count: 'count' },
    ]

    const [items, totalCountObj] = await Promise.all([
      db.mealCategory.aggregateRaw({
        pipeline: pipelineData,
        options
      }) as unknown as (MealCategory & { name: string })[],
      db.mealCategory.aggregateRaw({
        pipeline: pipelineCount
      }) as unknown as { count: number }[]
    ])
    const totalCount = totalCountObj[0]?.count ?? 0;

    const nextCursor = skip + limit < totalCount ? skip + limit : undefined;

    return {
      items,
      nextCursor,
      totalCount,
    }
  });

const mealCategoryRouter = {
  getMany,
  create,
  getOne,
  update,
  remove,
  count,
  getInfinite,
  getManyByIds,
}

export default mealCategoryRouter;



