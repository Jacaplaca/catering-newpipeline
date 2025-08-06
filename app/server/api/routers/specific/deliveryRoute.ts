import { db } from '@root/app/server/db';
import { type DeliveryRoute, RoleType } from '@prisma/client';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { getRouteListValid, getRoutesValidator, removeRouteValidator, routeCreateValidator, routeEditValidator, routeGetOneValidator } from '@root/app/validators/specific/deliveryRoute';
import { getQueryOrder } from '@root/app/lib/safeDbQuery';
import { getQueryPagination } from '@root/app/lib/safeDbQuery';
import { routeSortNames } from '@root/types/specific';
import getLowerCaseSort from '@root/app/lib/lower-case-sort-pipeline';
import getDeliveryRoutesDbQuery from './libs/getDeliveryRoutesDbQuery';
import { options } from '@root/app/server/api/specific/aggregate';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

const checkUnique = async (code: string, cateringId: string) => {
  const route = await db.deliveryRoute.findFirst({
    where: {
      code: {
        equals: code,
        mode: 'insensitive',
      },
      cateringId,
    },
  });

  if (route) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'routes:duplicate_code_error' });
  }
}


const getMany = createCateringProcedure([RoleType.manager])
  .input(getRoutesValidator)
  .query(({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { page, limit, sortName, sortDirection } = input;

    const pagination = getQueryPagination({ page, limit });

    const allowedSortNames = routeSortNames;

    const orderBy = getQueryOrder({
      name: sortName,
      direction: sortDirection,
      allowedNames: allowedSortNames,
      inNumbers: true
    });

    const pipeline = [
      ...getDeliveryRoutesDbQuery({ catering }),
      ...getLowerCaseSort(orderBy),
      { $skip: pagination.skip },
      { $limit: pagination.take },
    ]

    return db.deliveryRoute.aggregateRaw({
      pipeline,
      options
    }) as unknown as DeliveryRoute[];
  });

const count = createCateringProcedure([RoleType.manager])
  .input(z.object({}))
  .query(async ({ ctx }) => {
    const { session: { catering } } = ctx;

    const count = await db.deliveryRoute.count({
      where: {
        cateringId: catering.id,
      }
    });

    return count;
  });


const create = createCateringProcedure([RoleType.manager])
  .input(routeCreateValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { name, code } = input;

    await checkUnique(code, catering.id);

    const route = await db.deliveryRoute.create({
      data: {
        name,
        code,
        cateringId: catering.id,
      }
    })

    return route;
  });

const getOne = createCateringProcedure([RoleType.manager])
  .input(routeGetOneValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { id } = input;

    const route = await db.deliveryRoute.findUnique({
      where: {
        id,
        cateringId: catering.id,
      }
    });

    if (!route) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'routes:route_not_found' });
    }

    return route;
  });

const update = createCateringProcedure([RoleType.manager])
  .input(routeEditValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { id, name, code } = input;

    await checkUnique(code, catering.id);

    const route = await db.deliveryRoute.update({
      where: {
        id,
        cateringId: catering.id,
      },
      data: {
        name,
        code,
      }
    });

    return route;
  });

const remove = createCateringProcedure([RoleType.manager])
  .input(removeRouteValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { ids } = input;

    const routes = await db.deliveryRoute.deleteMany({
      where: {
        id: { in: ids },
        cateringId: catering.id,
      }
    });

    return routes;
  });

const getInfinite = createCateringProcedure([RoleType.manager])
  .input(getRouteListValid)
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
      ...getDeliveryRoutesDbQuery({ catering })
    ]

    const pipelineData = [
      ...pipeFragment,
      ...getLowerCaseSort({ "name": 1 }),
      { $addFields: { name: "$name" } },
      { $skip: skip },
      { $limit: limit },
    ]

    const pipelinCount = [
      ...pipeFragment,
      { $count: 'count' },
    ]

    const [items, totalCountObj] = await Promise.all([
      db.deliveryRoute.aggregateRaw({
        pipeline: pipelineData,
        options
      }) as unknown as (DeliveryRoute & { name: string })[],
      db.deliveryRoute.aggregateRaw({
        pipeline: pipelinCount
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

const tagRouter = {
  getMany,
  create,
  getOne,
  update,
  remove,
  count,
  getInfinite,
}

export default tagRouter;



