import { db } from '@root/app/server/db';
import { type FoodCategory, RoleType } from '@prisma/client';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { getQueryOrder } from '@root/app/lib/safeDbQuery';
import { getQueryPagination } from '@root/app/lib/safeDbQuery';
import { foodCategorySortNames } from '@root/types/specific';
import getLowerCaseSort from '@root/app/lib/lower-case-sort-pipeline';
import { options } from '@root/app/server/api/specific/aggregate';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { foodCategoryCreateValidator, foodCategoryEditValidator, foodCategoryGetManyByIdsValidator, foodCategoryGetOneValidator, foodCategoryListValidator, getFoodCategoriesValidator, removeFoodCategoryValidator } from '@root/app/validators/specific/foodCategory';
import getFoodCategoryDbQuery from '@root/app/server/api/routers/specific/libs/getFoodCategoryDbQuery';

const checkUnique = async (name: string, cateringId: string) => {
  const foodCategory = await db.foodCategory.findFirst({
    where: {
      name,
      cateringId,
    },
  });

  if (foodCategory) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'food:duplicate_category_name_error' });
  }
}


const getMany = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(getFoodCategoriesValidator)
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
      ...getFoodCategoryDbQuery({ catering }),
      ...getLowerCaseSort(orderBy),
      { $skip: pagination.skip },
      { $limit: pagination.take },
    ]

    return db.foodCategory.aggregateRaw({
      pipeline,
      options
    }) as unknown as FoodCategory[];
  });

const count = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(z.object({}))
  .query(async ({ ctx }) => {
    const { session: { catering } } = ctx;

    const count = await db.foodCategory.count({
      where: {
        cateringId: catering.id,
      }
    });

    return count;
  });


const create = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(foodCategoryCreateValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { name } = input;

    await checkUnique(name, catering.id);

    const foodCategory = await db.foodCategory.create({
      data: {
        name,
        cateringId: catering.id,
      }
    })

    return foodCategory;
  });

const getOne = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(foodCategoryGetOneValidator)
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
      throw new TRPCError({ code: 'NOT_FOUND', message: 'food:category_not_found' });
    }

    return foodCategory;
  });

const getManyByIds = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(foodCategoryGetManyByIdsValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { ids } = input;

    const foodCategories = await db.foodCategory.findMany({
      where: {
        id: { in: ids },
        cateringId: catering.id,
      }
    });

    return foodCategories;
  });

const update = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(foodCategoryEditValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { id, name } = input;

    await checkUnique(name, catering.id);

    const foodCategory = await db.foodCategory.update({
      where: {
        id,
        cateringId: catering.id,
      },
      data: {
        name,
      }
    });

    return foodCategory;
  });

const remove = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(removeFoodCategoryValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { ids } = input;

    const foodCategories = await db.foodCategory.deleteMany({
      where: {
        id: { in: ids },
        cateringId: catering.id,
      }
    });

    return foodCategories;
  });

const getInfinite = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(foodCategoryListValidator)
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
      ...getFoodCategoryDbQuery({ catering })
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
      db.foodCategory.aggregateRaw({
        pipeline: pipelineData,
        options
      }) as unknown as (FoodCategory & { name: string })[],
      db.foodCategory.aggregateRaw({
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

const foodCategoryRouter = {
  getMany,
  create,
  getOne,
  update,
  remove,
  count,
  getInfinite,
  getManyByIds,
}

export default foodCategoryRouter;



