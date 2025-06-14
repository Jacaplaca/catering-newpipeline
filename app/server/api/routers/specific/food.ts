import { db } from '@root/app/server/db';
import { type Food, RoleType } from '@prisma/client';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { getQueryOrder } from '@root/app/lib/safeDbQuery';
import { getQueryPagination } from '@root/app/lib/safeDbQuery';
import { foodSortNames, type FoodCustomTable } from '@root/types/specific';
import getLowerCaseSort from '@root/app/lib/lower-case-sort-pipeline';
import { options } from '@root/app/server/api/specific/aggregate';
import { TRPCError } from '@trpc/server';
import { foodCreateValidator, foodEditValidator, foodGetOneValidator, foodListValidator, getFoodsCountValidator, getFoodsValidator, removeFoodValidator } from '@root/app/validators/specific/food';
import getFoodDbQuery from '@root/app/server/api/routers/specific/libs/getFoodDbQuery';

const checkUnique = async (name: string, id: string, cateringId: string) => {
  const food = await db.food.findFirst({
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

  if (food) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'food:duplicate_name_error' });
  }
}


const getMany = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(getFoodsValidator)
  .query(({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { page, limit, sortName, sortDirection, foodCategory, allergens, searchValue } = input;

    const pagination = getQueryPagination({ page, limit });

    const allowedSortNames = foodSortNames;

    const orderBy = getQueryOrder({
      name: sortName,
      direction: sortDirection,
      allowedNames: allowedSortNames,
      inNumbers: true
    });

    const pipeline = [
      ...getFoodDbQuery({ catering, foodCategory, allergens, searchValue }),
      ...getLowerCaseSort(orderBy),
      { $skip: pagination.skip },
      { $limit: pagination.take },
    ]

    return db.food.aggregateRaw({
      pipeline,
      options
    }) as unknown as FoodCustomTable[];
  });

const count = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(getFoodsCountValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { foodCategory, allergens, searchValue } = input;

    const count = await db.order.aggregateRaw({
      pipeline: [
        ...getFoodDbQuery({ catering, foodCategory, allergens, searchValue }),
        { $count: 'count' },
      ]
    }) as unknown as { count: number }[];
    return count[0]?.count ?? 0;
  });


const create = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(foodCreateValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { name, ingredients, foodCategory, allergens } = input;

    await checkUnique(name, '', catering.id);

    return await db.$transaction(async (tx) => {
      // Create food
      const food = await tx.food.create({
        data: {
          name,
          ingredients,
          foodCategoryId: foodCategory?.id,
          cateringId: catering.id,
        }
      });

      // Create allergen relationships if any
      if (allergens && allergens.length > 0) {
        await tx.foodAllergen.createMany({
          data: allergens.map(allergen => ({
            foodId: food.id,
            allergenId: allergen.id
          }))
        });
      }

      return food;
    });
  });

const getOne = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(foodGetOneValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { id } = input;

    const food = await db.food.aggregateRaw({
      pipeline: getFoodDbQuery({ id, catering })
    }) as unknown as FoodCustomTable[];
    return food[0];
    // return await db.food.findUnique({
    //   where: {
    //     id,
    //     cateringId: catering.id,
    //   }
    // });
  });

const update = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(foodEditValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { id, name, ingredients, foodCategory, allergens } = input;

    await checkUnique(name, id, catering.id);

    // Use transaction to handle food update and allergens relationship
    return await db.$transaction(async (tx) => {
      // Update food data
      const food = await tx.food.update({
        where: {
          id,
          cateringId: catering.id,
        },
        data: {
          name,
          ingredients,
          foodCategoryId: foodCategory?.id,
        }
      });

      // Delete existing allergen relationships
      await tx.foodAllergen.deleteMany({
        where: { foodId: id }
      });

      // Create new allergen relationships if any
      if (allergens && allergens.length > 0) {
        await tx.foodAllergen.createMany({
          data: allergens.map(allergen => ({
            foodId: id,
            allergenId: allergen.id
          }))
        });
      }

      return food;
    });
  });

const remove = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(removeFoodValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { ids } = input;

    const foods = await db.food.deleteMany({
      where: {
        id: { in: ids },
        cateringId: catering.id,
      }
    });

    return foods;
  });

const getInfinite = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(foodListValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { cursor, limit, searchValue, excludeAllergens } = input;
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
      ...getFoodDbQuery({ catering, excludeAllergens })
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
      db.food.aggregateRaw({
        pipeline: pipelineData,
        options
      }) as unknown as (Food & { name: string })[],
      db.food.aggregateRaw({
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

const foodRouter = {
  getMany,
  create,
  getOne,
  update,
  remove,
  count,
  getInfinite,
}

export default foodRouter;



