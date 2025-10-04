import { type ConsumerFood, type Prisma } from '@prisma/client';


type ConsumerFoodWithExclusions = ConsumerFood & {
    exclusions?: Array<{ exclusionId: string }>;
};


// Helper function to process consumer food data
const processConsumerFood = (
    consumerFood: ConsumerFoodWithExclusions | null | undefined,
    food: { id: string; mealId: string },
    consumer: { id: string; clientId: string },
    regularMenuId: string,
    cateringId: string
): Prisma.ConsumerFoodCreateManyInput => {
    const consumerFoodData: Prisma.ConsumerFoodCreateManyInput = {
        cateringId,
        regularMenuId,
        consumerId: consumer.id,
        foodId: food.id,
        mealId: food.mealId,
        clientId: consumer.clientId,
    };

    if (consumerFood) {
        consumerFoodData.comment = consumerFood.comment;
        consumerFoodData.alternativeFoodId = consumerFood.alternativeFoodId;
        consumerFoodData.ignoredAllergens = consumerFood.ignoredAllergens;
    }

    return consumerFoodData;
};

// Helper function to extract exclusion IDs from consumer food
const extractExclusions = (consumerFood: ConsumerFoodWithExclusions | null | undefined): string[] | null => {
    if (!Array.isArray(consumerFood?.exclusions) || consumerFood.exclusions.length === 0) {
        return null;
    }

    const exclusionIds = consumerFood.exclusions
        .map(e => e.exclusionId)
        .filter((id): id is string => typeof id === 'string');

    return exclusionIds.length > 0 ? exclusionIds : null;
};

const getExclusionsAndConsumerFoodsToCreate = ({ foods, consumers, regularMenuId, cateringId, exampleConsumerFoods }: { foods: { id: string; mealId: string }[], consumers: { id: string; clientId: string }[], regularMenuId: string, cateringId: string, exampleConsumerFoods: Record<string, Record<string, ConsumerFoodWithExclusions | null>> | undefined }) => {

    const exclusionsMap = new Map<string, string[]>();
    const consumerFoodsToCreate: Prisma.ConsumerFoodCreateManyInput[] = [];

    for (const food of foods) {
        const consumerFoods = exampleConsumerFoods?.[food.id];
        for (const consumer of consumers) {
            const consumerFood = consumerFoods?.[consumer.id];

            // Create consumer food data
            const consumerFoodData = processConsumerFood(consumerFood, food, consumer, regularMenuId, cateringId);
            consumerFoodsToCreate.push(consumerFoodData);

            // Extract and store exclusions
            const exclusionIds = extractExclusions(consumerFood);
            if (exclusionIds) {
                exclusionsMap.set(`${food.id}:${consumer.id}`, exclusionIds);
            }
        }
    }

    return { exclusionsMap, consumerFoodsToCreate };

}

export default getExclusionsAndConsumerFoodsToCreate;

