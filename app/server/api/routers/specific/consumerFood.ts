import { RoleType } from '@prisma/client';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { db } from '@root/app/server/db';
import { autoReplaceValidator, consumerFoodGetByClientIdValidator, consumerFoodGetOneValidator, consumerFoodValidator, resetOneValidator } from '@root/app/validators/specific/consumerFood';
import { type ClientFoodAssignment } from '@root/types/specific';
import { TRPCError } from '@trpc/server';
import getCommonAllergens from '@root/app/specific/components/FoodMenu/ConsumerDiets/ExpandedRow/getCommonAllergens';


const update = createCateringProcedure([RoleType.manager, RoleType.dietician])
  .input(consumerFoodValidator)
  .mutation(({ input, ctx }) => {
    const { session: { catering } } = ctx;
    const { id, food, exclusions, comment } = input;

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
    const data = await db.consumerFood.findMany({
      where: {
        consumer: {
          clientId,
        },
        regularMenu: {
          day,
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

    // Find another consumerFood with same food and consumer with EXACTLY the same allergens
    const alternativeAssignment = await db.consumerFood.findFirst({
      where: {
        id: { not: currentAssignment.id },           // Exclude current assignment
        consumerId: { not: currentAssignment.consumerId }, // musi być inny consumer
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

    if (!alternativeAssignment) {
      throw error;
    }

    // CRITICAL: Additional validation to ensure EXACT match of allergens
    const alternativeConsumerAllergenIds = alternativeAssignment.consumer.allergens.map(ca => ca.allergenId);

    if (currentConsumerAllergenIds.length > 0) {
      // Check if both arrays have EXACTLY the same length and same elements
      const hasExactSameAllergens =
        alternativeConsumerAllergenIds.length === currentConsumerAllergenIds.length &&
        alternativeConsumerAllergenIds.length > 0 &&
        alternativeConsumerAllergenIds.every(id => currentConsumerAllergenIds.includes(id)) &&
        currentConsumerAllergenIds.every(id => alternativeConsumerAllergenIds.includes(id));

      if (!hasExactSameAllergens) {
        // console.log('Alternative assignment does not have exact same allergens, skipping');
        // console.log('Current allergens:', currentConsumerAllergenIds);
        // console.log('Alternative allergens:', alternativeConsumerAllergenIds);
        throw error;
      }
    } else {
      // Current consumer has no allergens, alternative must also have no allergens
      if (alternativeConsumerAllergenIds.length > 0) {
        // console.log('Current consumer has no allergens but alternative has allergens, skipping');
        throw error;
      }
    }

    // Check for common allergens if alternativeAssignment exists
    const consumerAllergens = alternativeAssignment.consumer.allergens.map(ca => ca.allergen);
    const foodAllergens = alternativeAssignment.food.allergens.map(fa => fa.allergen);
    const exclusionAllergens = alternativeAssignment.exclusions.flatMap(e =>
      e.exclusion.allergens.map(ea => ea.allergen)
    );

    const commonAllergens = getCommonAllergens(consumerAllergens, foodAllergens, exclusionAllergens);

    // console.log('Common allergens found:', commonAllergens);

    // You can now use commonAllergens for your logic
    if (commonAllergens.length) {
      // Handle case when there are common allergens
      return error;
    }

    return db.consumerFood.update({
      where: { id },
      data: {
        food: {
          connect: { id: alternativeAssignment.foodId },
        },
        exclusions: {
          create: alternativeAssignment.exclusions.map(e => ({
            exclusion: {
              connect: { id: e.exclusionId },
            },
          }))
        },
        comment: currentAssignment.comment ?? '',
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
        exclusions: { deleteMany: {} },
        comment: '',
      },
    });
  });

const consumerFoodRouter = {
  update,
  getOne,
  getByClientId,
  autoReplace,
  resetOne,
};

export default consumerFoodRouter;
