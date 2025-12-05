import { db } from '@root/app/server/db';
import { type Prisma, RoleType } from '@prisma/client';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { regularMenuCreateValidator, regularMenuEditValidator, regularMenuGetOneValidator, regularMenuRemoveValidator, regularMenuListValidator, regularMenuConfigureDaysValidator, getClientsWithCommonAllergensValidator, createAssignmentsValidator, updateFoodsOrderInput, getOneClientWithCommonAllergensValidator, closeAndPublishValidator, getConsumerWeekMenuValidator } from '@root/app/validators/specific/regularMenu';
import { TRPCError } from '@trpc/server';
import getManyClients from '@root/app/server/api/routers/specific/libs/getManyClients';
import checkCommonAllergens from '@root/app/server/api/routers/specific/libs/allergens/checkCommonAllergens';
import checkIndividualMenu from '@root/app/server/api/routers/specific/libs/checkIndividualMenu';
import { options } from '@root/app/server/api/specific/aggregate';
import getClientsDbQuery from '@root/app/server/api/routers/specific/libs/getClientsDbQuery';
import { type ClientCustomTable } from '@root/types/specific';
import getConsumers from '@root/app/server/api/routers/specific/libs/consumerFoods/getConsumers';
import getOriginalMenu from '@root/app/server/api/routers/specific/libs/consumerFoods/getOriginalMenu';
import addFoodToConsumers from '@root/app/server/api/routers/specific/libs/consumerFoods/addFoodToConsumers';
import assignConsumerFoods from '@root/app/server/api/routers/specific/libs/consumerFoods/assignConsumerFoods';
import addMealFoodsToMenu from '@root/app/server/api/routers/specific/libs/menu/addMealFoodsToMenu';
import updateRegularMenu from '@root/app/server/api/routers/specific/libs/regularMenu/update';
import { publicProcedure } from '@root/app/server/api/trpc';
import getWeekDays from '@root/app/server/api/routers/specific/libs/getWeekDays';
import getDayFoodData from '@root/app/server/api/routers/specific/libs/getDayFoodData';
import groupDataByConsumer from '@root/app/server/api/routers/specific/libs/consumerFoods/dayMenuPdf/groupDataByConsumer';
import transformMenuForConsumer from '@root/app/server/api/routers/specific/libs/regularMenu/transformMenuForConsumer';
import getManyClientsForCount from '@root/app/server/api/routers/specific/libs/getManyClientsForCount';

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
      isPublished: result.isPublished,
      day: result.day,
      foods: result.menuMealFoods.map(menuMealFood => ({
        id: menuMealFood.food.id,
        name: menuMealFood.food.name,
        ingredients: menuMealFood.food.ingredients,
        mealId: menuMealFood.mealId,
        order: menuMealFood.order,
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

    return updateRegularMenu({ regularMenuId, cateringId, foods, day });
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

    const basePipeline: Prisma.InputJsonValue[] = [{ $match: { cateringId: catering.id, clientId: null } }];

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
    const { day, clientIds } = input;

    const clients = await getManyClients(input, catering, { allowedClientIds: clientIds });

    const clientsWithCommonAllergens = await Promise.all(clients.map(async (client) => {
      const hasCommonAllergens = await checkCommonAllergens(catering.id, day, client.id);
      const hasIndividualMenu = await checkIndividualMenu(catering.id, day, client.id);
      return { ...client, hasCommonAllergens, hasIndividualMenu };
    }));
    return clientsWithCommonAllergens;
  });

const getClientWithCommonAllergensIds = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(getClientsWithCommonAllergensValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { day, consumerAllergenId, foodAllergenId } = input;

    let allowedClientIds: string[] | undefined;

    if (consumerAllergenId) {
      const consumersWithAllergen = await db.consumerAllergen.findMany({
        where: { allergenId: consumerAllergenId },
        select: { consumerId: true },
      });
      const consumerIds = consumersWithAllergen.map((ca) => ca.consumerId);

      if (consumerIds.length === 0) {
        allowedClientIds = [];
      } else {
        const consumerFoods = await db.consumerFood.findMany({
          where: {
            consumerId: { in: consumerIds },
            cateringId: catering.id,
            regularMenu: {
              day: {
                year: day.year,
                month: day.month,
                day: day.day,
              },
            },
          },
          select: { clientId: true },
          distinct: ['clientId'],
        });
        allowedClientIds = consumerFoods.map((cf) => cf.clientId);
      }
    }

    if (foodAllergenId) {
      const foodsWithAllergen = await db.foodAllergen.findMany({
        where: { allergenId: foodAllergenId },
        select: { foodId: true }
      });
      const foodIds = foodsWithAllergen.map(f => f.foodId);

      if (foodIds.length === 0) {
        allowedClientIds = [];
      } else {
        // Fetch potential matches: either the main food or the alternative food has the allergen
        const consumerFoods = await db.consumerFood.findMany({
          where: {
            cateringId: catering.id,
            regularMenu: {
              day: {
                year: day.year,
                month: day.month,
                day: day.day,
              },
            },
            OR: [
              { alternativeFoodId: { in: foodIds } },
              { foodId: { in: foodIds } }
            ]
          },
          select: {
            clientId: true,
            foodId: true,
            alternativeFoodId: true
          },
        });

        // Filter in memory to correctly handle the logic:
        // If alternativeFoodId exists, checking it overrides checking foodId.
        // If alternativeFoodId is missing (null), we check foodId.
        const clientIdsFromFood = consumerFoods
          .filter(cf => {
            const actualFoodId = cf.alternativeFoodId ?? cf.foodId;
            return foodIds.includes(actualFoodId);
          })
          .map(cf => cf.clientId);

        const uniqueClientIdsFromFood = [...new Set(clientIdsFromFood)];

        if (allowedClientIds === undefined) {
          allowedClientIds = uniqueClientIdsFromFood;
        } else {
          allowedClientIds = allowedClientIds.filter(id => uniqueClientIdsFromFood.includes(id));
        }
      }
    }

    if (input.foodId) {
      const targetFoodId = input.foodId;
      // Fetch potential matches: either the main food or the alternative food matches foodId
      const consumerFoods = await db.consumerFood.findMany({
        where: {
          cateringId: catering.id,
          regularMenu: {
            day: {
              year: day.year,
              month: day.month,
              day: day.day,
            },
          },
          OR: [
            { alternativeFoodId: targetFoodId },
            { foodId: targetFoodId }
          ]
        },
        select: {
          clientId: true,
          foodId: true,
          alternativeFoodId: true
        },
      });

      // Filter in memory to correctly handle the logic (same as for allergens)
      const clientIdsFromSpecificFood = consumerFoods
        .filter(cf => {
          const actualFoodId = cf.alternativeFoodId ?? cf.foodId;
          return actualFoodId === targetFoodId;
        })
        .map(cf => cf.clientId);

      const uniqueClientIds = [...new Set(clientIdsFromSpecificFood)];

      if (allowedClientIds === undefined) {
        allowedClientIds = uniqueClientIds;
      } else {
        allowedClientIds = allowedClientIds.filter(id => uniqueClientIds.includes(id));
      }
    }

    return await getManyClientsForCount(input, catering, { allowedClientIds });
  });

const closeAndPublish = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(closeAndPublishValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { day, clientId } = input;

    const clients = await db.client.findMany({
      where: {
        cateringId: catering.id,
        ...(clientId && { id: clientId }),
      },
    });

    const clientsWithCommonAllergens = await Promise.all(clients.map(async (client) => {
      const hasCommonAllergens = await checkCommonAllergens(catering.id, day, client.id);
      return { ...client, hasCommonAllergens };
    }))
    const clientsWithCommonAllergensShort = clientsWithCommonAllergens.filter(client => client.hasCommonAllergens).map(client => ({
      id: client.id,
      name: client.info.name,
      code: client.info.code,
    }));
    if (clientsWithCommonAllergensShort.length === 0) {
      await db.regularMenu.updateMany({
        where: { cateringId: catering.id, day },
        data: { isPublished: true },
      });
    }
    return clientsWithCommonAllergensShort;
  });
const unPublish = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(closeAndPublishValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { day, clientId } = input;

    const clients = await db.client.findMany({
      where: {
        cateringId: catering.id,
        ...(clientId && { id: clientId }),
      },
    });

    if (clients.length) {
      await db.regularMenu.updateMany({
        where: { cateringId: catering.id, day },
        data: { isPublished: false },
      });
    }
    return clients;
  });

const getOneClientWithCommonAllergens = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(getOneClientWithCommonAllergensValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { day } = input;

    const pipeline = [
      ...getClientsDbQuery({ catering, clientId: input.clientId, showColumns: input.showColumns }),
    ]

    const clients = await db.client.aggregateRaw({
      pipeline,
      options
    }) as unknown as ClientCustomTable[];

    const clientsWithCommonAllergens = await Promise.all(clients.map(async (client) => {
      const hasCommonAllergens = await checkCommonAllergens(catering.id, day, client.id);
      const hasIndividualMenu = await checkIndividualMenu(catering.id, day, client.id);
      return { ...client, hasCommonAllergens, hasIndividualMenu };
    }));
    return clientsWithCommonAllergens[0];
  });

const createAssignments = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(createAssignmentsValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { day, clientId, consumerId } = input;
    const cateringId = catering.id;
    console.log(input);

    return db.$transaction(async (tx) => {
      const regularMenu = await tx.regularMenu.findFirst({
        where: { cateringId, clientId, day },
      }) ?? await tx.regularMenu.findFirst({
        where: { cateringId, day, clientId: undefined },
      });

      if (regularMenu) {
        await tx.consumerFood.deleteMany({
          where: {
            regularMenuId: regularMenu.id,
            consumerId,
          },
        });

        const menuMealFoods = await tx.menuMealFood.findMany({
          where: {
            regularMenuId: regularMenu.id,
          },
        });

        const foods = menuMealFoods.map(m => ({
          id: m.foodId,
          mealId: m.mealId,
        }));

        await addFoodToConsumers(tx, {
          cateringId,
          menu: regularMenu,
          foods,
          consumerIds: [consumerId]
        });

        return regularMenu;
      }

      return null;
    });
  });


const updateFoodsOrder = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(updateFoodsOrderInput)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { items } = input;

    return db.$transaction(async (tx) => {
      // Update order for each MenuMealFood item
      const updatePromises = items.map(item =>
        tx.menuMealFood.updateMany({
          where: {
            foodId: item.id,
            regularMenu: {
              cateringId: catering.id,
            },
          },
          data: {
            order: item.order,
          },
        })
      );

      await Promise.all(updatePromises);

      return {
        success: true,
        updatedCount: items.length,
      };
    });
  });

const getConsumerWeekMenu = publicProcedure
  .input(getConsumerWeekMenuValidator)
  .query(async ({ input }) => {
    const { dayId, consumerId } = input;

    let cateringId = null;
    let clientId = null;
    const consumer = await db.consumer.findUnique({ where: { id: consumerId } });
    if (consumer) {
      cateringId = consumer.cateringId;
      clientId = consumer.clientId;
    }

    if (!cateringId || !clientId) {
      throw new Error('Catering not found');
    }

    const days = getWeekDays(dayId);

    const allMealsData = await getDayFoodData({
      dayIds: days,
      cateringId,
      ignoreOrders: true,
      clientId,
      onlyPublished: true,
      consumerIds: [consumerId],
    });



    try {
      const groupedData = groupDataByConsumer(allMealsData);
      const consumerData = transformMenuForConsumer(groupedData);
      return consumerData;

    } catch (error) {
      console.error(error);
      throw error;
    }
  });

const regularRouter = {
  // getMany,
  create,
  update,
  removeByClient,
  getInfinite,
  getOne,
  configuredDays,
  getClientsWithCommonAllergens,
  getClientWithCommonAllergensIds,
  createAssignments,
  updateFoodsOrder,
  getOneClientWithCommonAllergens,
  closeAndPublish,
  unPublish,
  getConsumerWeekMenu,
  // addNewClientsToMenu,
  // checkIfAllClientsHaveMenu,
  // count,
}

export default regularRouter;



