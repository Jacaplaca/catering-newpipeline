import getCommonAllergens from '@root/app/server/api/routers/specific/libs/allergens/getCommonAllergens';
import { db } from '@root/app/server/db';

const checkCommonAllergens = async (cateringId: string, day: { year: number, month: number, day: number }, clientId: string): Promise<boolean> => {
    // First, find all regular menus for the given day and catering
    const regularMenus = await db.regularMenu.findMany({
        where: {
            cateringId,
            day: {
                year: day.year,
                month: day.month,
                day: day.day
            }
        },
        select: {
            id: true,
            clientId: true
        }
    });

    // Prefer menu assigned to provided clientId, otherwise the global one (null / missing)
    const regularMenuId =
        regularMenus.find(rm => rm.clientId === clientId)?.id ??
        regularMenus.find(rm => rm.clientId == null)?.id; // null OR undefined

    if (!regularMenuId) {
        return false; // No menu found for this day
    }

    // Get only IDs of consumer foods for this regular menu and client
    const consumerFoodIds = await db.consumerFood.findMany({
        where: {
            regularMenuId,
            clientId
        },
        select: { id: true }
    });

    // Check each consumer food until we find common allergens
    for (const { id: consumerFoodId } of consumerFoodIds) {
        // console.log('Checking consumer food:', consumerFoodId);
        // Get consumer food with all necessary data for allergen checking
        const consumerFood = await db.consumerFood.findUnique({
            where: { id: consumerFoodId },
            select: {
                id: true,
                consumerId: true,
                foodId: true,
                alternativeFoodId: true,
                comment: true,
                ignoredAllergens: true
            }
        });

        if (!consumerFood) continue;

        // Get consumer allergens
        const consumerAllergens = await db.consumerAllergen.findMany({
            where: { consumerId: consumerFood.consumerId },
            include: { allergen: true }
        });

        // Determine which food to check for allergens (alternative if exists, otherwise original)
        const foodIdToCheck = consumerFood.alternativeFoodId ?? consumerFood.foodId;

        // Get food allergens (from alternative food if exists, otherwise from original food)
        const foodAllergens = await db.foodAllergen.findMany({
            where: { foodId: foodIdToCheck },
            include: { allergen: true }
        });

        // Get exclusion allergens for this consumer food
        const consumerFoodWithExclusions = await db.consumerFood.findUnique({
            where: { id: consumerFood.id },
            include: {
                exclusions: {
                    include: {
                        exclusion: {
                            include: {
                                allergens: {
                                    include: {
                                        allergen: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        const exclusionAllergens = consumerFoodWithExclusions?.exclusions.flatMap(cf =>
            cf.exclusion.allergens.map(ea => ea.allergen)
        ) ?? [];

        // Check for common allergens
        const commonAllergens = getCommonAllergens({
            consumerAllergens: consumerAllergens.map(ca => ({
                id: ca.allergen.id,
                name: ca.allergen.name
            })),
            foodAllergens: foodAllergens.map(fa => ({
                id: fa.allergen.id,
                name: fa.allergen.name
            })),
            exclusionAllergens: exclusionAllergens.map(ea => ({
                id: ea.id,
                name: ea.name
            })),
            comment: consumerFood.comment,
            ignoredAllergens: consumerFood.ignoredAllergens
        });

        // If we found common allergens, return true immediately
        if (commonAllergens.length > 0) {
            // const foodType = consumerFood.alternativeFoodId ? 'alternative food' : 'original food';
            // console.log(`Found common allergens for consumer ${consumerFood.consumerId} and ${foodType} ${foodIdToCheck}:`, commonAllergens);
            return true;
        }
    }

    // No common allergens found in any consumer food
    return false;
};

export default checkCommonAllergens;