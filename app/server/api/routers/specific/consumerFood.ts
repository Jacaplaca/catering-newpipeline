import { RoleType } from '@prisma/client';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { db } from '@root/app/server/db';
import { autoReplaceValidator, consumerFoodGetByClientIdValidator, consumerFoodGetOneValidator, consumerFoodValidator, getSimilarCommentsValidator, resetOneValidator } from '@root/app/validators/specific/consumerFood';
import { type ClientFoodAssignment } from '@root/types/specific';
import { TRPCError } from '@trpc/server';
import getCommonAllergens from '@root/app/server/api/routers/specific/libs/allergens/getCommonAllergens';
import fixConsumerFoods from '@root/app/server/api/routers/specific/libs/fixConsumerFoods';

const getRawAssignments = async ({
  menuId,
  cateringId,
  clientId,
  consumerId,
  id,
}: {
  id?: string;
  menuId?: string;
  cateringId?: string;
  clientId?: string;
  consumerId?: string;
}) => {
  return await db.consumerFood.findMany({
    where: {
      id,
      consumer: {
        clientId,
        id: consumerId,
      },
      regularMenu: {
        id: menuId,
      },
      cateringId,
    },
    include: {
      regularMenu: true,
      consumer: {
        include: {
          allergens: {
            include: {
              allergen: true,
            },
          },
        },
      },
      food: {
        include: {
          allergens: {
            include: {
              allergen: true,
            },
          },
        },
      },
      alternativeFood: {
        include: {
          allergens: {
            include: {
              allergen: true,
            },
          },
        },
      },
      meal: true,
      exclusions: {
        include: {
          exclusion: {
            include: {
              allergens: {
                include: { allergen: true },
              },
            },
          },
        },
      },
    },
  })
}

const getMenuId = async ({
  clientId,
  day,
  cateringId,
}: {
  clientId: string;
  day: { year: number, month: number, day: number };
  cateringId: string;
}) => {
  const clientMenu = await db.regularMenu.findFirst({
    where: {
      clientId,
      day,
      cateringId,
    },
  });

  const standardMenu = await db.regularMenu.findFirst({
    where: {
      day,
      cateringId,
      clientId: { isSet: false }
    },
  });

  const menuId = clientMenu?.id ?? standardMenu?.id;

  return menuId;
}

const update = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(consumerFoodValidator)
  .mutation(async ({ input }) => {
    // const { session: { catering } } = ctx;
    const { id, food, exclusions, comment, alternativeFood, ignoredAllergens } = input;

    if (!food.id) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No safe foods selected',
      });
    }

    await db.consumerFood.update({
      where: { id },
      data: {
        food: {
          connect: { id: food.id },
        },
        ...(alternativeFood?.id
          ? { alternativeFood: { connect: { id: alternativeFood.id } } }
          : { alternativeFood: { disconnect: true } }),
        comment,
        ignoredAllergens,
        exclusions: {
          deleteMany: {},
          create: exclusions.map(e => ({
            exclusion: {
              connect: { id: e.id },
            },
          })),
        },
      },
    });
    const rawAssignments = await getRawAssignments({ id });
    return rawAssignments[0] as unknown as ClientFoodAssignment;
  });

const getOne = createCateringProcedure([RoleType.manager])
  .input(consumerFoodGetOneValidator)
  .query(({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { id } = input;
    return db.consumerFood.findFirst({
      where: {
        id,
        cateringId: catering.id,
      },
    });
  });





const getByClientId = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(consumerFoodGetByClientIdValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { clientId, day } = input;

    const menuId = await getMenuId({ clientId, day, cateringId: catering.id });

    const menu = await db.regularMenu.findUnique({
      where: {
        id: menuId,
      },
    });
    if (!menu) {
      return {
        rawAssignments: [],
        menuMealFoods: [],
      };
    }


    const menuMealFoods = await db.menuMealFood.findMany({
      where: {
        regularMenuId: menu.id,
      },
    });


    await fixConsumerFoods(menu, menuMealFoods, clientId, catering.id, menu.id);

    const rawAssignments = await getRawAssignments({ menuId: menu.id, cateringId: catering.id, clientId });
    return {
      rawAssignments: rawAssignments as unknown as ClientFoodAssignment[],
      menuMealFoods,
      // currentConsumerIds,
      // consumersWithMenuIds,
      // newConsumerIds,
    }
  });

const autoReplace = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(autoReplaceValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { id } = input;

    const currentAssignment = await db.consumerFood.findFirst({
      where: {
        id,
        cateringId: catering.id,
      },
      select: {
        id: true,
        foodId: true,
        regularMenuId: true,
        consumer: {
          select: {
            allergens: {
              select: {
                allergenId: true,
              },
            },
          },
        },
      },
    });

    // const message = 'menu-creator:no-similar-assignment'
    // const error = new TRPCError({
    //   code: 'BAD_REQUEST',
    //   message,
    // })

    if (!currentAssignment) {
      return;
    }

    // Get allergen IDs from current consumer
    const currentConsumerAllergenIds = currentAssignment.consumer.allergens.map(ca => ca.allergenId);

    // Build filter that allows ONLY consumers with EXACTLY the same allergens
    const consumerFilter = currentConsumerAllergenIds.length
      ? {
        AND: [
          // 1. Kandydat musi posiadać KAŻDY alergen z listy bieżącego klienta
          ...currentConsumerAllergenIds.map(id => ({
            allergens: { some: { allergenId: id } },   // must contain this id
          })),
          // 2. Kandydat nie może mieć innych alergenów poza dozwolonymi
          { allergens: { every: { allergenId: { in: currentConsumerAllergenIds } } } },
        ],
      }
      : {
        // Bieżący klient nie ma alergenów – szukamy konsumentów również bez alergenów
        allergens: { none: {} },
      };

    // Find ALL alternative assignments with same food and consumer with EXACTLY the same allergens
    const alternativeAssignments = await db.consumerFood.findMany({
      where: {
        id: { not: currentAssignment.id },           // Exclude current assignment
        foodId: currentAssignment.foodId,            // Same food
        cateringId: catering.id,
        consumer: consumerFilter,
        regularMenuId: currentAssignment.regularMenuId,
      },
      include: {
        consumer: {
          include: {
            allergens: {
              include: {
                allergen: true,
              },
            },
          },
        },
        food: {
          include: {
            allergens: {
              include: {
                allergen: true,
              },
            },
          },
        },
        alternativeFood: {
          include: {
            allergens: {
              include: {
                allergen: true,
              },
            },
          },
        },
        exclusions: {
          include: {
            exclusion: {
              include: {
                allergens: { include: { allergen: true } },
              },
            },
          },
        },
      },
    });

    // Filter assignments to find safe ones (without common allergens)
    const safeAlternativeAssignments = alternativeAssignments.filter(assignment => {
      const { consumer, food, alternativeFood, exclusions, comment, ignoredAllergens } = assignment;

      // CRITICAL: Additional validation to ensure EXACT match of allergens
      const alternativeConsumerAllergenIds = consumer.allergens.map(ca => ca.allergenId);

      if (currentConsumerAllergenIds.length > 0) {
        // Check if both arrays have EXACTLY the same length and same elements
        const hasExactSameAllergens =
          alternativeConsumerAllergenIds.length === currentConsumerAllergenIds.length &&
          alternativeConsumerAllergenIds.length > 0 &&
          alternativeConsumerAllergenIds.every(id => currentConsumerAllergenIds.includes(id)) &&
          currentConsumerAllergenIds.every(id => alternativeConsumerAllergenIds.includes(id));

        if (!hasExactSameAllergens) {
          return false;
        }
      } else {
        // Current consumer has no allergens, alternative must also have no allergens
        if (alternativeConsumerAllergenIds.length > 0) {
          return false;
        }
      }

      // Check for common allergens
      const consumerAllergens = consumer.allergens.map(ca => ca.allergen);
      // Use alternativeFood if available, otherwise use food
      const foodAllergens = alternativeFood
        ? alternativeFood.allergens.map(fa => fa.allergen)
        : food.allergens.map(fa => fa.allergen);
      const exclusionAllergens = exclusions.flatMap(e =>
        e.exclusion.allergens.map(ea => ea.allergen)
      );

      const commonAllergens = getCommonAllergens({ consumerAllergens, foodAllergens, exclusionAllergens, comment, ignoredAllergens });

      // Return true only if NO common allergens (safe assignment)
      return commonAllergens.length === 0;
    });

    // Select first safe alternative assignment
    const alternativeAssignment = safeAlternativeAssignments[0];

    if (!alternativeAssignment) {
      return;
    }

    const { foodId, alternativeFoodId, exclusions, comment } = alternativeAssignment;

    return db.consumerFood.update({
      where: { id },
      data: {
        food: {
          connect: { id: foodId },
        },
        alternativeFood: alternativeFoodId ? {
          connect: { id: alternativeFoodId },
        } : { disconnect: true },
        exclusions: {
          create: exclusions.map(e => ({
            exclusion: {
              connect: { id: e.exclusionId },
            },
          }))
        },
        comment: comment ?? '',
      },
    });
  });


const resetOne = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(resetOneValidator)
  .mutation(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { id } = input;

    const currentAssignment = await db.consumerFood.findFirst({
      where: {
        id,
        cateringId: catering.id,
      },
      include: {
        regularMenu: true,
      },
    });

    if (!currentAssignment) {
      return null;
    }

    await db.consumerFood.update({
      where: { id },
      data: {
        food: {
          connect: {
            id: currentAssignment.foodId,
          },
        },
        alternativeFood: { disconnect: true },
        exclusions: { deleteMany: {} },
        comment: '',
      },
    });
    const rawAssignments = await getRawAssignments({ id });
    return rawAssignments[0] as unknown as ClientFoodAssignment;
  });

const getSimilarComments = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(getSimilarCommentsValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { consumerFoodId, query } = input;

    const limit = 10;

    // Get original assignment with only food IDs
    const originalConsumerFood = await db.consumerFood.findFirst({
      where: {
        id: consumerFoodId,
        cateringId: catering.id,
      },
      select: {
        id: true,
        foodId: true,
        alternativeFoodId: true,
        comment: true,
      },
    });

    if (!originalConsumerFood) {
      return [];
    }

    const { foodId: originalFoodId, alternativeFoodId: originalAlternativeFoodId } = originalConsumerFood;

    // Build search conditions - look for assignments where food or alternativeFood matches
    const searchFoodIds = [originalFoodId, originalAlternativeFoodId].filter((id): id is string => Boolean(id));

    if (searchFoodIds.length === 0) {
      return [];
    }

    // Build match conditions for comment field
    const commentMatchConditions: Record<string, unknown> = {
      $exists: true,
      $ne: null,
      $nin: ['', ...(originalConsumerFood.comment ? [originalConsumerFood.comment] : [])],
      ...(query ? { $regex: query, $options: 'i' } : {}),
    };

    // Build aggregation pipeline to group and count comments directly in MongoDB
    const pipeline = [
      // Match stage - filter documents
      {
        $match: {
          // _id: { $ne: { $oid: originalConsumerFood.id } }, // exclude original (commented out as per user request)
          cateringId: catering.id,
          comment: commentMatchConditions,
          $or: [
            { foodId: { $in: searchFoodIds } },
            { alternativeFoodId: { $in: searchFoodIds } },
          ],
        },
      },
      // Add stage to trim comments
      {
        $addFields: {
          trimmedComment: { $trim: { input: '$comment' } },
        },
      },
      // Filter out empty trimmed comments
      {
        $match: {
          trimmedComment: { $ne: '' },
        },
      },
      // Group by comment and count occurrences
      {
        $group: {
          _id: '$trimmedComment',
          count: { $sum: 1 },
        },
      },
      // Sort by count descending
      {
        $sort: { count: -1 },
      },
      // Limit results
      {
        $limit: limit,
      },
      // Project only the comment field
      {
        $project: {
          _id: 0,
          comment: '$_id',
        },
      },
    ];

    // Execute aggregation pipeline using $aggregateRaw (better for aggregation than $runCommandRaw)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const result = await db.consumerFood.aggregateRaw({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      pipeline: pipeline as any,
    }) as unknown as Array<{ comment: string }>;

    // Result is already the array of documents, no need to extract from cursor
    const sortedComments = result.map(item => item.comment);

    return sortedComments;
  });

const consumerFoodRouter = {
  update,
  getOne,
  getByClientId,
  autoReplace,
  resetOne,
  getSimilarComments,
};

export default consumerFoodRouter;
