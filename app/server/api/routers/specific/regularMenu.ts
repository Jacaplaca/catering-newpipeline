import { db } from '@root/app/server/db';
import { type Prisma, type RegularMenu, RoleType } from '@prisma/client';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { regularMenuCreateValidator, regularMenuEditValidator, regularMenuGetOneValidator, regularMenuRemoveValidator, regularMenuListValidator, regularMenuConfigureDaysValidator, getClientsWithCommonAllergensValidator, createAssignmentsValidator, updateFoodsOrderInput, getOneClientWithCommonAllergensValidator } from '@root/app/validators/specific/regularMenu';
import { TRPCError } from '@trpc/server';
import getManyClients from '@root/app/server/api/routers/specific/libs/getManyClients';
import checkCommonAllergens from '@root/app/server/api/routers/specific/libs/allergens/checkCommonAllergens';
import checkIndividualMenu from '@root/app/server/api/routers/specific/libs/checkIndividualMenu';
import { options } from '@root/app/server/api/specific/aggregate';
import getClientsDbQuery from '@root/app/server/api/routers/specific/libs/getClientsDbQuery';
import { type ClientCustomTable } from '@root/types/specific';

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

const getConsumers = async (tx: Prisma.TransactionClient, { cateringId, clientId, update, consumerIds }: { cateringId: string, clientId?: string | null, update?: boolean, consumerIds?: string[] }) => {

  const matchCondition: {
    cateringId: string;
    $or: { deactivated: boolean | null }[];
    clientId?: string | { $nin: string[] };
    _id?: { $in: string[] };
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

  if (consumerIds) {
    matchCondition._id = { $in: consumerIds };
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
  { cateringId, menu, foods, update, consumerIds }: { cateringId: string, menu: RegularMenu, foods: { id: string; mealId: string }[], update?: boolean, consumerIds?: string[] }
) => {
  const consumers = await getConsumers(tx, { cateringId, clientId: menu.clientId, update, consumerIds });

  if (consumers.length === 0) return;

  if (menu.clientId) {
    const { day } = menu;
    const originalMenu = await getOriginalMenu(tx, cateringId, day);
    if (originalMenu) {
      // Get existing consumer foods from original menu for this client's consumers
      const existingConsumerFoods = await tx.consumerFood.findMany({
        where: {
          regularMenuId: originalMenu.id,
          consumerId: { in: consumers.map(c => c.id) },
        },
        include: {
          exclusions: {
            include: {
              exclusion: true,
            },
          },
        },
      });

      // Remove consumer foods from original menu
      await removeConsumerFoods(tx, originalMenu.id, consumers);

      // Create map of compatible assignments to transfer
      const transferableAssignments = new Map<string, {
        consumerId: string;
        foodId: string;
        alternativeFoodId: string | null;
        mealId: string;
        comment: string | null;
        exclusions: { exclusionId: string }[];
      }>();

      // Check which existing assignments can be transferred to new menu
      for (const existingFood of existingConsumerFoods) {
        const key = `${existingFood.consumerId}:${existingFood.mealId}`;
        const isCompatible = foods.some(newFood =>
          newFood.mealId === existingFood.mealId &&
          newFood.id === existingFood.foodId
        );

        if (isCompatible) {
          transferableAssignments.set(key, {
            consumerId: existingFood.consumerId,
            foodId: existingFood.foodId,
            alternativeFoodId: existingFood.alternativeFoodId,
            mealId: existingFood.mealId,
            comment: existingFood.comment,
            exclusions: existingFood.exclusions.map(e => ({ exclusionId: e.exclusionId })),
          });
        }
      }

      // Create consumer foods for new menu, preserving transferable assignments
      const consumerFoodsToCreate: Prisma.ConsumerFoodCreateManyInput[] = [];
      const consumerFoodExclusionsToCreate: { consumerFoodId: string; exclusionId: string }[] = [];

      for (const food of foods) {
        for (const consumer of consumers) {
          const key = `${consumer.id}:${food.mealId}`;
          const transferableData = transferableAssignments.get(key);

          if (transferableData && transferableData.foodId === food.id) {
            // Use existing assignment data
            const consumerFood = await tx.consumerFood.create({
              data: {
                cateringId,
                regularMenuId: menu.id,
                consumerId: consumer.id,
                foodId: transferableData.foodId,
                alternativeFoodId: transferableData.alternativeFoodId,
                mealId: transferableData.mealId,
                clientId: consumer.clientId,
                comment: transferableData.comment,
              },
            });

            // Re-create exclusions for transferred assignment
            for (const exclusion of transferableData.exclusions) {
              consumerFoodExclusionsToCreate.push({
                consumerFoodId: consumerFood.id,
                exclusionId: exclusion.exclusionId,
              });
            }
          } else {
            // Create new assignment
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
      }

      // Create remaining new consumer foods (those without transferable data)
      if (consumerFoodsToCreate.length > 0) {
        await tx.consumerFood.createMany({
          data: consumerFoodsToCreate,
        });
      }

      // Create exclusions for transferred assignments
      if (consumerFoodExclusionsToCreate.length > 0) {
        await tx.consumerFoodExclusion.createMany({
          data: consumerFoodExclusionsToCreate,
        });
      }
    } else {
      // No original menu exists, create new assignments normally
      await assignConsumerFoods(tx, { menu, foods, consumers, cateringId });
    }
  } else {
    // This is a general menu (not client-specific), create assignments normally
    await assignConsumerFoods(tx, { menu, foods, consumers, cateringId });
  }
};

const addMealFoodsToMenu = async (
  tx: Prisma.TransactionClient,
  regularMenuId: string,
  foods: { id: string; mealId: string, order?: number | null }[]
) => {
  const menuMealFoodsData = foods.map(food => ({
    regularMenuId,
    mealId: food.mealId,
    foodId: food.id,
    order: food.order,
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

      const existingMenuMealFoods = await tx.menuMealFood.findMany({
        where: { regularMenuId },
        select: { id: true, foodId: true, mealId: true, order: true },
      });

      const existingFoodsSet = new Set(existingMenuMealFoods.map(f => `${f.foodId}:${f.mealId}`));
      const newFoodsSet = new Set(foods.map(f => `${f.id}:${f.mealId}`));

      const foodsToAdd = foods.filter(f => !existingFoodsSet.has(`${f.id}:${f.mealId}`));
      const foodsToRemove = existingMenuMealFoods.filter(f => !newFoodsSet.has(`${f.foodId}:${f.mealId}`));

      // Check if only order has changed (no additions/removals)
      const isOnlyOrderChange = foodsToAdd.length === 0 && foodsToRemove.length === 0;

      if (isOnlyOrderChange) {
        // Only update orders without deleting/adding records
        const orderUpdatePromises = foods
          .filter(food => food.order !== undefined)
          .map(food => {
            const existingItem = existingMenuMealFoods.find(
              existing => existing.foodId === food.id && existing.mealId === food.mealId
            );

            if (existingItem && existingItem.order !== food.order) {
              return tx.menuMealFood.update({
                where: { id: existingItem.id },
                data: { order: food.order },
              });
            }
            return null;
          })
          .filter(promise => promise !== null);

        if (orderUpdatePromises.length > 0) {
          await Promise.all(orderUpdatePromises);
        }
      }

      // Only perform add/remove operations if it's not just an order change
      if (!isOnlyOrderChange) {
        if (foodsToRemove.length > 0) {
          const removeConditions = foodsToRemove.map(f => ({ foodId: f.foodId, mealId: f.mealId }));

          await tx.consumerFood.deleteMany({
            where: {
              regularMenuId,
              OR: removeConditions,
            },
          });

          await tx.menuMealFood.deleteMany({
            where: {
              regularMenuId,
              OR: removeConditions,
            },
          });

          // Normalize order for remaining items - get all remaining menuMealFoods and reorder them
          const remainingMenuMealFoods = await tx.menuMealFood.findMany({
            where: {
              regularMenuId,
            },
            orderBy: [
              { mealId: 'asc' },
              { order: 'asc' },
            ],
          });

          // Update order for remaining items to be sequential starting from 0
          const updateOrderPromises = remainingMenuMealFoods.map((item, index) =>
            tx.menuMealFood.update({
              where: {
                id: item.id,
              },
              data: {
                order: index,
              },
            })
          );

          await Promise.all(updateOrderPromises);
        }

        if (foodsToAdd.length > 0) {
          await addMealFoodsToMenu(tx, regularMenuId, foodsToAdd);
          await addFoodToConsumers(tx, { cateringId, menu: clientMenu, foods: foodsToAdd, update: true });
        }

        // Update order for existing items that weren't added or removed but have order changes
        const existingFoodsToUpdate = foods
          .filter(food =>
            food.order !== undefined &&
            !foodsToAdd.some(addedFood => addedFood.id === food.id && addedFood.mealId === food.mealId)
          )
          .map(food => {
            const existingItem = existingMenuMealFoods.find(
              existing => existing.foodId === food.id && existing.mealId === food.mealId
            );

            if (existingItem && existingItem.order !== food.order) {
              return tx.menuMealFood.update({
                where: { id: existingItem.id },
                data: { order: food.order },
              });
            }
            return null;
          })
          .filter(promise => promise !== null);

        if (existingFoodsToUpdate.length > 0) {
          await Promise.all(existingFoodsToUpdate);
        }
      }

      const regularMenu = await tx.regularMenu.update({
        where: { id: regularMenuId },
        data: { day },
      });

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


const regularRouter = {
  // getMany,
  create,
  update,
  removeByClient,
  getInfinite,
  getOne,
  configuredDays,
  getClientsWithCommonAllergens,
  createAssignments,
  updateFoodsOrder,
  getOneClientWithCommonAllergens,
  // count,
}

export default regularRouter;



