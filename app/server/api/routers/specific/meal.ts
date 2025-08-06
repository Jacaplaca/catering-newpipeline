import { db } from '@root/app/server/db';
import { type Meal, RoleType } from '@prisma/client';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { getQueryOrder } from '@root/app/lib/safeDbQuery';
import { getQueryPagination } from '@root/app/lib/safeDbQuery';
import { mealSortNames } from '@root/types/specific';
import getLowerCaseSort from '@root/app/lib/lower-case-sort-pipeline';
import { options } from '@root/app/server/api/specific/aggregate';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { removeMealValidator, mealCreateValidator, mealEditValidator, mealGetOneValidator, getMealsValidator } from '@root/app/validators/specific/meal';
import getMealsDbQuery from '@root/app/server/api/routers/specific/libs/getMealsDbQuery';

const checkUnique = async (name: string, cateringId: string, mealId?: string) => {
  const meal = await db.meal.findFirst({
    where: {
      name: {
        equals: name,
        mode: 'insensitive',
      },
      cateringId,
      id: {
        not: mealId,
      },
    },
  });

  if (meal) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'meals:duplicate_name_error' });
  }
}


const getMany = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(getMealsValidator)
  .query(({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { page, limit, sortName, sortDirection } = input;

    const pagination = getQueryPagination({ page, limit });

    const allowedSortNames = mealSortNames;

    const orderBy = getQueryOrder({
      name: sortName,
      direction: sortDirection,
      allowedNames: allowedSortNames,
      inNumbers: true
    });

    const pipeline = [
      ...getMealsDbQuery({ catering }),
      ...getLowerCaseSort(orderBy),
      { $skip: pagination.skip },
      { $limit: pagination.take },
    ]

    return db.meal.aggregateRaw({
      pipeline,
      options
    }) as unknown as Meal[];
  });

const count = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(z.object({}))
  .query(async ({ ctx }) => {
    const { session: { catering } } = ctx;

    const count = await db.meal.count({
      where: {
        cateringId: catering.id,
      }
    });

    return count;
  });


const create = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(mealCreateValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { name } = input;

    await checkUnique(name, catering.id);

    const meal = await db.meal.create({
      data: {
        name,
        cateringId: catering.id,
      }
    })

    return meal;
  });

const getOne = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(mealGetOneValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { id } = input;

    const meal = await db.meal.findUnique({
      where: {
        id,
        cateringId: catering.id,
      }
    });

    if (!meal) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'meals:meal_not_found' });
    }

    return meal;
  });

const update = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(mealEditValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { id, name } = input;

    await checkUnique(name, catering.id, id);

    const meal = await db.meal.update({
      where: {
        id,
        cateringId: catering.id,
      },
      data: {
        name,
      }
    });

    return meal;
  });

const remove = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(removeMealValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { ids } = input;

    const meals = await db.meal.deleteMany({
      where: {
        id: { in: ids },
        cateringId: catering.id,
      }
    });

    return meals;
  });

const getAll = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .query(async ({ ctx }) => {
    const { session: { catering } } = ctx;
    return db.meal.findMany({
      where: {
        cateringId: catering.id,
      }
    });
  });

const mealRouter = {
  getMany,
  create,
  getOne,
  update,
  remove,
  count,
  getAll,
}

export default mealRouter;



