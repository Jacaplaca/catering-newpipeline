import { RoleType } from '@prisma/client';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { db } from '@root/app/server/db';
import { autoReplaceValidator, consumerFoodGetByClientIdValidator, consumerFoodGetOneValidator, consumerFoodValidator, getSimilarCommentsValidator, resetOneValidator } from '@root/app/validators/specific/consumerFood';
import { type ClientFoodAssignment } from '@root/types/specific';
import { TRPCError } from '@trpc/server';
import getCommonAllergens from '@root/app/server/api/routers/specific/libs/allergens/getCommonAllergens';


const update = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(consumerFoodValidator)
  .mutation(({ input }) => {
    // const { session: { catering } } = ctx;
    const { id, food, exclusions, comment, alternativeFood } = input;

    if (!food.id) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No safe foods selected',
      });
    }

    return db.consumerFood.update({
      where: { id },
      data: {
        food: {
          connect: { id: food.id },
        },
        ...(alternativeFood?.id
          ? { alternativeFood: { connect: { id: alternativeFood.id } } }
          : { alternativeFood: { disconnect: true } }),
        comment,
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

    const clientMenu = await db.regularMenu.findFirst({
      where: {
        clientId,
        day,
        cateringId: catering.id,
      },
    });

    const standardMenu = await db.regularMenu.findFirst({
      where: {
        day,
        cateringId: catering.id,
        clientId: { isSet: false }
      },
    });

    const menuId = clientMenu?.id ?? standardMenu?.id;

    const data = await db.consumerFood.findMany({
      where: {
        consumer: {
          clientId,
        },
        regularMenu: {
          id: menuId,
        },
        cateringId: catering.id,
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
    });
    return data as unknown as ClientFoodAssignment[]
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
    });

    const message = 'menu-creator:no-similar-assignment'
    const error = new TRPCError({
      code: 'BAD_REQUEST',
      message,
    })

    if (!currentAssignment) {
      throw error;
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
      const { consumer, food, alternativeFood, exclusions, comment } = assignment;

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

      const commonAllergens = getCommonAllergens({ consumerAllergens, foodAllergens, exclusionAllergens, comment });

      // Return true only if NO common allergens (safe assignment)
      return commonAllergens.length === 0;
    });

    // Select first safe alternative assignment
    const alternativeAssignment = safeAlternativeAssignments[0];

    if (!alternativeAssignment) {
      throw error;
    }

    const { consumer, foodId, food, alternativeFoodId, alternativeFood, exclusions, comment } = alternativeAssignment;

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

    return db.consumerFood.update({
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
  });

const getSimilarComments = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(getSimilarCommentsValidator)
  .query(async ({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { consumerFoodId, query } = input;

    const limit = 10;

    const originalConsumerFood = await db.consumerFood.findFirst({
      where: {
        id: consumerFoodId,
        cateringId: catering.id,
      },
      include: {
        consumer: {
          include: {
            allergens: true,
          },
        },
        food: true,
        alternativeFood: true,
      },
    });

    if (!originalConsumerFood) {
      return [];
    }

    // Get allergen IDs from original consumer
    const originalConsumerAllergenIds = originalConsumerFood.consumer.allergens.map(ca => ca.allergenId);

    if (originalConsumerAllergenIds.length === 0) {
      return [];
    }

    // Get food IDs to match (original food and alternative food)
    const foodIdsToMatch = [originalConsumerFood.foodId];
    if (originalConsumerFood.alternativeFoodId) {
      foodIdsToMatch.push(originalConsumerFood.alternativeFoodId);
    }

    const similarConsumerFoods = await db.consumerFood.findMany({
      where: {
        id: { not: originalConsumerFood.id },
        cateringId: catering.id,
        // Check if comment contains query (if provided)
        ...(query ? {
          comment: {
            contains: query,
            mode: 'insensitive',
            not: originalConsumerFood.comment ?? '',
          },
        } : {}),
        // Consumer must have at least one common allergen
        consumer: {
          allergens: {
            some: {
              allergenId: {
                in: originalConsumerAllergenIds,
              },
            },
          },
        },
        // Food or alternativeFood must match (cross-check)
        OR: [
          // Original food matches food
          { foodId: { in: foodIdsToMatch } },
          // Original food matches alternativeFood
          { alternativeFoodId: { in: foodIdsToMatch } },
        ],
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
        food: true,
        alternativeFood: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Filter comments, remove duplicates using Set, and apply limit
    const comments = Array.from(new Set(
      similarConsumerFoods
        .filter(cf => cf.comment && cf.comment.trim().length > 0)
        .map(cf => cf.comment)
        .filter(comment => comment !== originalConsumerFood.comment)
        .filter(comment => comment)
    )).slice(0, limit);

    return comments;
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
