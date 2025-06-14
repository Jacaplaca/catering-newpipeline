import { db } from '@root/app/server/db';
import { type Allergen, RoleType } from '@prisma/client';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { getQueryOrder } from '@root/app/lib/safeDbQuery';
import { getQueryPagination } from '@root/app/lib/safeDbQuery';
import { allergenSortNames } from '@root/types/specific';
import getLowerCaseSort from '@root/app/lib/lower-case-sort-pipeline';
import getAllergensDbQuery from './libs/getAllergensDbQuery';
import { options } from '@root/app/server/api/specific/aggregate';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { removeAllergenValidator, allergenCreateValidator, allergenEditValidator, allergenGetOneValidator, getAllergensValidator, getAllergenListValidator } from '@root/app/validators/specific/allergen';

const checkUnique = async (name: string, cateringId: string) => {
  const allergen = await db.allergen.findFirst({
    where: {
      name,
      cateringId,
    },
  });

  if (allergen) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'allergens:duplicate_name_error' });
  }
}


const getMany = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(getAllergensValidator)
  .query(({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { page, limit, sortName, sortDirection } = input;

    const pagination = getQueryPagination({ page, limit });

    const allowedSortNames = allergenSortNames;

    const orderBy = getQueryOrder({
      name: sortName,
      direction: sortDirection,
      allowedNames: allowedSortNames,
      inNumbers: true
    });

    const pipeline = [
      ...getAllergensDbQuery({ catering }),
      ...getLowerCaseSort(orderBy),
      { $skip: pagination.skip },
      { $limit: pagination.take },
    ]

    return db.allergen.aggregateRaw({
      pipeline,
      options
    }) as unknown as Allergen[];
  });

const count = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(z.object({}))
  .query(async ({ ctx }) => {
    const { session: { catering } } = ctx;

    const count = await db.allergen.count({
      where: {
        cateringId: catering.id,
      }
    });

    return count;
  });


const create = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(allergenCreateValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { name } = input;

    await checkUnique(name, catering.id);

    const allergen = await db.allergen.create({
      data: {
        name,
        cateringId: catering.id,
      }
    })

    return allergen;
  });

const getOne = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(allergenGetOneValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { id } = input;

    const allergen = await db.allergen.findUnique({
      where: {
        id,
        cateringId: catering.id,
      }
    });

    if (!allergen) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'allergens:allergen_not_found' });
    }

    return allergen;
  });

const update = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(allergenEditValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { id, name } = input;

    await checkUnique(name, catering.id);

    const allergen = await db.allergen.update({
      where: {
        id,
        cateringId: catering.id,
      },
      data: {
        name,
      }
    });

    return allergen;
  });

const remove = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(removeAllergenValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { ids } = input;

    const allergens = await db.allergen.deleteMany({
      where: {
        id: { in: ids },
        cateringId: catering.id,
      }
    });

    return allergens;
  });

const getInfinite = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(getAllergenListValidator)
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
            {
              "code": {
                $type: "string",
                $regex: searchValue,
                $options: "i"
              }
            }
          ]
        }
      },
      ...getAllergensDbQuery({ catering })
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
      db.allergen.aggregateRaw({
        pipeline: pipelineData,
        options
      }) as unknown as (Allergen & { name: string })[],
      db.allergen.aggregateRaw({
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

const allergenRouter = {
  getMany,
  create,
  getOne,
  update,
  remove,
  count,
  getInfinite,
}

export default allergenRouter;



