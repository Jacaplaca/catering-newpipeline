import { db } from '@root/app/server/db';
import { type Prisma, type RegularMenu, RoleType } from '@prisma/client';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { regularMenuCreateValidator, regularMenuEditValidator, regularMenuGetOneValidator, regularMenuRemoveValidator, regularMenuListValidator, regularMenuConfigureDaysValidator, getClientsWithCommonAllergensValidator } from '@root/app/validators/specific/regularMenu';
import { TRPCError } from '@trpc/server';
import getManyClients from '@root/app/server/api/routers/specific/libs/getManyClients';
import checkCommonAllergens from '@root/app/server/api/routers/specific/libs/allergens/checkCommonAllergens';
import checkIndividualMenu from '@root/app/server/api/routers/specific/libs/checkIndividualMenu';

const getClientsWithMenus = async (tx: Prisma.TransactionClient, cateringId: string) => {
  return await tx.regularMenu.findMany({
    where: {
      cateringId,
      clientId: { not: null },
    },
    select: {
      clientId: true,
    },
  }) as unknown as { clientId: string }[];
}

const getConsumers = async (tx: Prisma.TransactionClient, { cateringId, clientId, update }: { cateringId: string, clientId?: string | null, update?: boolean }) => {

  const matchCondition: {
    cateringId: string;
    $or: { deactivated: boolean | null }[];
    clientId?: string | { $nin: string[] };
  } = {
    cateringId,
    $or: [{ deactivated: false }, { deactivated: null }],
  }

  if (clientId) {
    matchCondition.clientId = clientId;
  }

  if (!clientId && update) {
    const clientsWithMenus = await getClientsWithMenus(tx, cateringId);
    matchCondition.clientId = { $nin: clientsWithMenus.map(c => c.clientId) };
  }

  return await tx.consumer.aggregateRaw({
    pipeline: [
      {
        $match: matchCondition,
      },
      {
        $project: {
          id: { $toString: '$_id' },
          clientId: 1,
          _id: 0,
        },
      },
    ],
  }) as unknown as { id: string, clientId: string }[];
};

const getOriginalMenu = async (tx: Prisma.TransactionClient, cateringId: string, day: { year: number, month: number, day: number }) => {
  return await tx.regularMenu.findFirst({
    where: {
      cateringId,
      day: {
        year: day.year,
        month: day.month,
        day: day.day,
      },
      clientId: undefined,
    },
  });
};

const assignConsumerFoods = async (
  tx: Prisma.TransactionClient,
  { menu, foods, consumers, cateringId }: { menu: RegularMenu, foods: { id: string; mealId: string }[], consumers: { id: string, clientId: string }[], cateringId: string }
) => {

  const consumerFoodsToCreate: Prisma.ConsumerFoodCreateManyInput[] = [];

  for (const food of foods) {
    for (const consumer of consumers) {
      consumerFoodsToCreate.push({
        cateringId,
        regularMenuId: menu.id,
        consumerId: consumer.id,
        foodId: food.id,
        mealId: food.mealId,
        clientId: consumer.clientId,
      });
    }
  }

  if (consumerFoodsToCreate.length > 0) {
    await tx.consumerFood.createMany({
      data: consumerFoodsToCreate,
    });
  }

}

const removeConsumerFoods = async (
  tx: Prisma.TransactionClient,
  regularMenuId: string,
  consumers: { id: string }[],
) => {
  await tx.consumerFood.deleteMany({
    where: {
      regularMenuId,
      consumerId: { in: consumers.map(c => c.id) },
    },
  });
}



const addFoodToConsumers = async (
  tx: Prisma.TransactionClient,
  { cateringId, menu, foods, update }: { cateringId: string, menu: RegularMenu, foods: { id: string; mealId: string }[], update?: boolean }
) => {
  const consumers = await getConsumers(tx, { cateringId, clientId: menu.clientId, update });

  // if (update) {
  //   const clientsWithMenus = await getClientsWithMenus(tx, cateringId);

  // }

  if (consumers.length === 0) return;

  if (menu.clientId) {
    const { day } = menu;
    const originalMenu = await getOriginalMenu(tx, cateringId, day);
    if (originalMenu) {
      await removeConsumerFoods(tx, originalMenu.id, consumers);
    }
  }

  await assignConsumerFoods(tx, { menu, foods, consumers, cateringId });
};

const addMealFoodsToMenu = async (
  tx: Prisma.TransactionClient,
  regularMenuId: string,
  foods: { id: string; mealId: string }[]
) => {
  const menuMealFoodsData = foods.map(food => ({
    regularMenuId,
    mealId: food.mealId,
    foodId: food.id,
  }));

  if (menuMealFoodsData.length > 0) {
    await tx.menuMealFood.createMany({
      data: menuMealFoodsData,
    });
  }
};

const create = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(regularMenuCreateValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { day, foods, clientId } = input;

    const cateringId = catering.id;

    return db.$transaction(async (tx) => {
      const regularMenu = await tx.regularMenu.create({
        data: {
          day,
          ...(clientId && {
            client: {
              connect: { id: clientId },
            },
          }),
          catering: {
            connect: { id: cateringId },
          },
        },
      });

      // Add meals and foods to menu
      await addMealFoodsToMenu(tx, regularMenu.id, foods);

      await addFoodToConsumers(tx, { cateringId, menu: regularMenu, foods });

      return regularMenu;
    });
  });

const getOne = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(regularMenuGetOneValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { day, clientId } = input;

    if (!day) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Day is required',
      });
    }

    const matchCondition = {
      cateringId: catering.id,
      day: {
        year: day.year,
        month: day.month,
        day: day.day,
      },
      ...(clientId && {
        clientId,
      }),
    };

    const result = await db.regularMenu.findFirst({
      where: matchCondition,
      include: {
        menuMealFoods: {
          include: {
            meal: true,
            food: {
              include: {
                allergens: {
                  include: {
                    allergen: true,
                  }
                },
                foodCategory: true,
              }
            }
          },
          orderBy: {
            order: 'asc',
          }
        }
      }
    });

    if (!result) {
      return null;
    }

    // Transform data to match getOne structure
    const transformedResult = {
      id: result.id,
      day: result.day,
      foods: result.menuMealFoods.map(menuMealFood => ({
        id: menuMealFood.food.id,
        name: menuMealFood.food.name,
        ingredients: menuMealFood.food.ingredients,
        mealId: menuMealFood.mealId,
        allergens: menuMealFood.food.allergens.map(foodAllergen => ({
          id: foodAllergen.allergen.id,
          name: foodAllergen.allergen.name,
        })),
        // Additional field that getOne doesn't have
        foodCategory: menuMealFood.food.foodCategory ? {
          id: menuMealFood.food.foodCategory.id,
          name: menuMealFood.food.foodCategory.name,
        } : null,
      }))
    };

    return transformedResult;
  });

const update = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(regularMenuEditValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { id: regularMenuId, day, foods } = input;

    const cateringId = catering.id;

    return db.$transaction(async (tx) => {
      const clientMenu = await tx.regularMenu.findFirst({
        where: {
          id: regularMenuId,
          cateringId,
        },
      });

      if (!clientMenu) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Menu not found or you do not have permission to edit it.',
        });
      }

      // Remove existing consumer foods and regular menu meals
      await tx.consumerFood.deleteMany({
        where: { regularMenuId }
      });

      await tx.menuMealFood.deleteMany({
        where: { regularMenuId }
      });

      // Update the menu
      const regularMenu = await tx.regularMenu.update({
        where: { id: regularMenuId },
        data: { day },
      });

      // Add meals and foods to menu
      await addMealFoodsToMenu(tx, regularMenuId, foods);

      // Add new foods to consumers
      await addFoodToConsumers(tx, { cateringId, menu: clientMenu, foods, update: true });

      return regularMenu;
    });
  });

const removeByClient = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(regularMenuRemoveValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { clientId, day } = input;
    const cateringId = catering.id;

    return db.$transaction(async (tx) => {
      const clientMenu = await tx.regularMenu.findFirst({
        where: {
          cateringId,
          clientId,
          day: {
            year: day.year,
            month: day.month,
            day: day.day,
          },
        },
      });

      if (!clientMenu) {
        return null;
      }

      const originalMenu = await getOriginalMenu(tx, cateringId, day);

      if (originalMenu) {
        // Get consumers for this client before deleting the menu
        const consumers = await getConsumers(tx, { cateringId, clientId });

        // Delete the client-specific menu (MenuMealFood and ConsumerFood will be deleted automatically)
        await tx.regularMenu.delete({
          where: { id: clientMenu.id },
        });

        // Get original menu's meal-food combinations
        const menuMealFoods = await tx.menuMealFood.findMany({
          where: {
            regularMenuId: originalMenu.id,
          },
        });

        // Transform to foods format expected by assignConsumerFoods
        const foods = menuMealFoods.map(m => ({
          id: m.foodId,
          mealId: m.mealId
        }));

        // Assign original menu foods to this client's consumers
        if (foods.length > 0 && consumers.length > 0) {
          await assignConsumerFoods(tx, { menu: originalMenu, foods, consumers, cateringId });
        }
      } else {
        // If no original menu exists, just delete the client menu
        await tx.regularMenu.delete({
          where: { id: clientMenu.id },
        });
      }

      return { success: true, deletedMenuId: clientMenu.id };
    });
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

const configuredDays = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(regularMenuConfigureDaysValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { month, year } = input;
    const cateringId = catering.id;

    // Calculate previous month
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;

    // Calculate next month
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;

    const menus = await db.regularMenu.findMany({
      where: {
        cateringId,
        OR: [
          {
            day: {
              is: {
                month: prevMonth,
                year: prevYear
              }
            }
          },
          {
            day: {
              is: {
                month,
                year
              }
            }
          },
          {
            day: {
              is: {
                month: nextMonth,
                year: nextYear
              }
            }
          }
        ]
      },
    });

    return menus.map(menu => menu.day);
  });

const getClientsWithCommonAllergens = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(getClientsWithCommonAllergensValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { day } = input;

    const clients = await getManyClients(input, catering);

    const clientsWithCommonAllergens = await Promise.all(clients.map(async (client) => {
      const hasCommonAllergens = await checkCommonAllergens(catering.id, day, client.id);
      const hasIndividualMenu = await checkIndividualMenu(catering.id, day, client.id);
      return { ...client, hasCommonAllergens, hasIndividualMenu };
    }));
    return clientsWithCommonAllergens;
  });

const regularRouter = {
  // getMany,
  create,
  update,
  removeByClient,
  getInfinite,
  getOne,
  configuredDays,
  getClientsWithCommonAllergens
  // count,
}

export default regularRouter;



