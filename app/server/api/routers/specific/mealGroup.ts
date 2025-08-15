import { db } from '@root/app/server/db';
import { type MealGroup, RoleType } from '@prisma/client';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { getQueryOrder } from '@root/app/lib/safeDbQuery';
import { getQueryPagination } from '@root/app/lib/safeDbQuery';
import { foodCategorySortNames } from '@root/types/specific';
import getLowerCaseSort from '@root/app/lib/lower-case-sort-pipeline';
import { options } from '@root/app/server/api/specific/aggregate';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { getMealGroupsValidator, mealGroupGetManyByIdsValidator, mealGroupGetOneValidator, mealGroupListValidator } from '@root/app/validators/specific/mealGroup';
import getMealGroupDbQuery from '@root/app/server/api/routers/specific/libs/getMealGroupDbQuery';

const getMany = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(getMealGroupsValidator)
  .query(({ input }) => {
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
      ...getMealGroupDbQuery({}),
      ...getLowerCaseSort(orderBy),
      { $skip: pagination.skip },
      { $limit: pagination.take },
    ]

    return db.mealGroup.aggregateRaw({
      pipeline,
      options
    }) as unknown as MealGroup[];
  });

const count = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(z.object({}))
  .query(async () => {
    const count = await db.mealGroup.count({
      where: {
      }
    });
    return count;
  });


const getOne = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(mealGroupGetOneValidator)
  .query(async ({ input }) => {
    const { id } = input;

    const mealGroup = await db.mealGroup.findUnique({
      where: {
        id,
      }
    });

    if (!mealGroup) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'meals:meal_group_not_found' });
    }

    return mealGroup;
  });

const getManyByIds = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(mealGroupGetManyByIdsValidator)
  .query(async ({ input }) => {
    const { ids } = input;

    const mealGroups = await db.mealGroup.findMany({
      where: {
        id: { in: ids },
      }
    });

    return mealGroups;
  });

const getAll = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .query(async () => {
    const mealGroups = await db.mealGroup.findMany();
    return mealGroups;
  });


const getInfinite = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(mealGroupListValidator)
  .query(async ({ input }) => {
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
      ...getMealGroupDbQuery({})
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
      db.mealGroup.aggregateRaw({
        pipeline: pipelineData,
        options
      }) as unknown as (MealGroup & { name: string })[],
      db.mealGroup.aggregateRaw({
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

const mealGroupRouter = {
  getMany,
  getOne,
  count,
  getInfinite,
  getManyByIds,
  getAll,
}

export default mealGroupRouter;



