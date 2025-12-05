import { db } from '@root/app/server/db';
import { type ClientCategory, RoleType } from '@prisma/client';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { getQueryOrder } from '@root/app/lib/safeDbQuery';
import { getQueryPagination } from '@root/app/lib/safeDbQuery';
import { foodCategorySortNames } from '@root/types/specific';
import getLowerCaseSort from '@root/app/lib/lower-case-sort-pipeline';
import { options } from '@root/app/server/api/specific/aggregate';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { clientCategoryCreateValidator, clientCategoryEditValidator, clientCategoryGetManyByIdsValidator, clientCategoryGetOneValidator, clientCategoryListValidator, getClientCategoriesValidator, removeClientCategoryValidator } from '@root/app/validators/specific/clientCategory';
import getClientCategoryDbQuery from '@root/app/server/api/routers/specific/libs/getClientCategoryDbQuery';

const checkUnique = async (code: string, cateringId: string, excludeId?: string) => {
  const clientCategory = await db.clientCategory.findFirst({
    where: {
      code: {
        equals: code,
        mode: 'insensitive',
      },
      cateringId,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

  if (clientCategory) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'clients:duplicate_category_code_error' });
  }
}


const getMany = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(getClientCategoriesValidator)
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
      ...getClientCategoryDbQuery({ catering }),
      ...getLowerCaseSort(orderBy),
      { $skip: pagination.skip },
      { $limit: pagination.take },
    ]

    return db.clientCategory.aggregateRaw({
      pipeline,
      options
    }) as unknown as ClientCategory[];
  });

const count = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(z.object({}))
  .query(async ({ ctx }) => {
    const { session: { catering } } = ctx;

    const count = await db.clientCategory.count({
      where: {
        cateringId: catering.id,
      }
    });

    return count;
  });


const create = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(clientCategoryCreateValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { name, code } = input;

    await checkUnique(code, catering.id);

    const clientCategory = await db.clientCategory.create({
      data: {
        name,
        code,
        cateringId: catering.id,
      }
    })

    return clientCategory;
  });

const getOne = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(clientCategoryGetOneValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { id } = input;

    const clientCategory = await db.clientCategory.findUnique({
      where: {
        id,
        cateringId: catering.id,
      }
    });

    if (!clientCategory) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'clients:category_not_found' });
    }

    return clientCategory;
  });

const getManyByIds = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(clientCategoryGetManyByIdsValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { ids } = input;

    const clientCategories = await db.clientCategory.findMany({
      where: {
        id: { in: ids },
        cateringId: catering.id,
      }
    });

    return clientCategories;
  });

const update = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(clientCategoryEditValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { id, name, code } = input;

    await checkUnique(code, catering.id, id);

    const clientCategory = await db.clientCategory.update({
      where: {
        id,
        cateringId: catering.id,
      },
      data: {
        name,
        code,
      }
    });

    return clientCategory;
  });

const remove = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(removeClientCategoryValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { ids } = input;

    const clientCategories = await db.clientCategory.deleteMany({
      where: {
        id: { in: ids },
        cateringId: catering.id,
      }
    });

    return clientCategories;
  });

const getInfinite = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(clientCategoryListValidator)
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
      ...getClientCategoryDbQuery({ catering })
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
      db.clientCategory.aggregateRaw({
        pipeline: pipelineData,
        options
      }) as unknown as (ClientCategory & { name: string })[],
      db.clientCategory.aggregateRaw({
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

const clientCategoryRouter = {
  getMany,
  create,
  getOne,
  update,
  remove,
  count,
  getInfinite,
  getManyByIds,
}

export default clientCategoryRouter;



