import { db } from '@root/app/server/db';
import { type Exclusion, RoleType } from '@prisma/client';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { getQueryOrder } from '@root/app/lib/safeDbQuery';
import { getQueryPagination } from '@root/app/lib/safeDbQuery';
import { exclusionSortNames, type ExclusionCustomTable } from '@root/types/specific';
import getLowerCaseSort from '@root/app/lib/lower-case-sort-pipeline';
import { options } from '@root/app/server/api/specific/aggregate';
import { TRPCError } from '@trpc/server';
import { exclusionCreateValidator, exclusionEditValidator, exclusionGetOneValidator, getExclusionsCountValidator, getExclusionsValidator, exclusionListValidator, removeExclusionValidator } from '@root/app/validators/specific/exclusion';
import getExclusionDbQuery from '@root/app/server/api/routers/specific/libs/getExclusionDbQuery';

const checkUnique = async (name: string, id: string, cateringId: string) => {
  const exclusion = await db.exclusion.findFirst({
    where: {
      name: {
        equals: name,
        mode: 'insensitive',
      },
      cateringId,
      id: {
        not: id,
      },
    },
  });

  if (exclusion) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'exclusion:duplicate_name_error' });
  }
}


const getMany = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(getExclusionsValidator)
  .query(({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { page, limit, sortName, sortDirection, allergens, searchValue } = input;

    const pagination = getQueryPagination({ page, limit });

    const allowedSortNames = exclusionSortNames;

    const orderBy = getQueryOrder({
      name: sortName,
      direction: sortDirection,
      allowedNames: allowedSortNames,
      inNumbers: true
    });

    const pipeline = [
      ...getExclusionDbQuery({ catering, allergens, searchValue }),
      ...getLowerCaseSort(orderBy),
      { $skip: pagination.skip },
      { $limit: pagination.take },
    ]

    return db.exclusion.aggregateRaw({
      pipeline,
      options
    }) as unknown as ExclusionCustomTable[];
  });

const count = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(getExclusionsCountValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { allergens, searchValue } = input;

    const count = await db.exclusion.aggregateRaw({
      pipeline: [
        ...getExclusionDbQuery({ catering, allergens, searchValue }),
        { $count: 'count' },
      ]
    }) as unknown as { count: number }[];
    return count[0]?.count ?? 0;
  });


const create = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(exclusionCreateValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { name, allergens } = input;

    await checkUnique(name, '', catering.id);

    return await db.$transaction(async (tx) => {
      // Create exclusion
      const exclusion = await tx.exclusion.create({
        data: {
          name,
          cateringId: catering.id,
        }
      });

      // Create allergen relationships if any
      if (allergens && allergens.length > 0) {
        await tx.exclusionAllergen.createMany({
          data: allergens.map(allergen => ({
            exclusionId: exclusion.id,
            allergenId: allergen.id
          }))
        });
      }

      return exclusion;
    });
  });

const getOne = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(exclusionGetOneValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { id } = input;

    const exclusion = await db.exclusion.aggregateRaw({
      pipeline: getExclusionDbQuery({ id, catering })
    }) as unknown as ExclusionCustomTable[];
    return exclusion[0];
  });

const update = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(exclusionEditValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { id, name, allergens } = input;

    await checkUnique(name, id, catering.id);

    // Use transaction to handle exclusion update and allergens relationship
    return await db.$transaction(async (tx) => {
      // Update exclusion data
      const exclusion = await tx.exclusion.update({
        where: {
          id,
          cateringId: catering.id,
        },
        data: {
          name,
        }
      });

      // Delete existing allergen relationships
      await tx.exclusionAllergen.deleteMany({
        where: { exclusionId: id }
      });

      // Create new allergen relationships if any
      if (allergens && allergens.length > 0) {
        await tx.exclusionAllergen.createMany({
          data: allergens.map(allergen => ({
            exclusionId: id,
            allergenId: allergen.id
          }))
        });
      }

      return exclusion;
    });
  });

const remove = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(removeExclusionValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { ids } = input;

    const exclusions = await db.exclusion.deleteMany({
      where: {
        id: { in: ids },
        cateringId: catering.id,
      }
    });

    return exclusions;
  });

const getInfinite = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(exclusionListValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { cursor, limit, searchValue, withAllergens } = input;
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
      ...getExclusionDbQuery({ catering, withAllergens })
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
      db.exclusion.aggregateRaw({
        pipeline: pipelineData,
        options
      }) as unknown as (Exclusion & { name: string })[],
      db.exclusion.aggregateRaw({
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

const exclusionRouter = {
  getMany,
  create,
  getOne,
  update,
  remove,
  count,
  getInfinite,
}

export default exclusionRouter;



