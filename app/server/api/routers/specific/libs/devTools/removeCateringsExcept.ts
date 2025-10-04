import { db } from "@root/app/server/db";

const removeCateringsExcept = async (protectedCateringIds: string[]) => {
    console.log("=== Starting catering removal process ===");
    console.log(`Protected catering IDs: ${protectedCateringIds.join(", ")}`);

    // 1. Find all caterings to remove (all except protected ones)
    const cateringsToRemove = await db.catering.findMany({
        where: {
            id: {
                notIn: protectedCateringIds,
            },
        },
        select: {
            id: true,
            name: true,
        },
    });

    console.log(`\nFound ${cateringsToRemove.length} caterings to remove:`);
    cateringsToRemove.forEach((catering) => {
        console.log(`  - ${catering.name ?? "Unnamed"} (${catering.id})`);
    });

    if (cateringsToRemove.length === 0) {
        console.log("\nNo caterings to remove. Exiting.");
        return;
    }

    const cateringIdsToRemove = cateringsToRemove.map((c) => c.id);

    // 2. Find all users associated with these caterings
    const usersToRemove = await db.user.findMany({
        where: {
            cateringId: {
                in: cateringIdsToRemove,
            },
        },
        select: {
            id: true,
            email: true,
            name: true,
        },
    });

    const userIdsToRemove = usersToRemove.map((u) => u.id);
    console.log(`\nFound ${usersToRemove.length} users to remove`);

    // 3. Count data before deletion (for reporting)
    const counts = {
        clients: await db.client.count({ where: { cateringId: { in: cateringIdsToRemove } } }),
        consumers: await db.consumer.count({ where: { cateringId: { in: cateringIdsToRemove } } }),
        orders: await db.order.count({ where: { cateringId: { in: cateringIdsToRemove } } }),
        consumerFoods: await db.consumerFood.count({ where: { cateringId: { in: cateringIdsToRemove } } }),
        regularMenus: await db.regularMenu.count({ where: { cateringId: { in: cateringIdsToRemove } } }),
        food: await db.food.count({ where: { cateringId: { in: cateringIdsToRemove } } }),
        meals: await db.meal.count({ where: { cateringId: { in: cateringIdsToRemove } } }),
        allergens: await db.allergen.count({ where: { cateringId: { in: cateringIdsToRemove } } }),
        exclusions: await db.exclusion.count({ where: { cateringId: { in: cateringIdsToRemove } } }),
        foodCategories: await db.foodCategory.count({ where: { cateringId: { in: cateringIdsToRemove } } }),
        mealCategories: await db.mealCategory.count({ where: { cateringId: { in: cateringIdsToRemove } } }),
        deliveryRoutes: await db.deliveryRoute.count({ where: { cateringId: { in: cateringIdsToRemove } } }),
        clientFiles: await db.clientFile.count({ where: { cateringId: { in: cateringIdsToRemove } } }),
        dieticians: await db.dietician.count({ where: { cateringId: { in: cateringIdsToRemove } } }),
        kitchens: await db.kitchen.count({ where: { cateringId: { in: cateringIdsToRemove } } }),
        managers: await db.manager.count({ where: { cateringId: { in: cateringIdsToRemove } } }),
    };

    console.log("\nCatering data to be deleted:");
    Object.entries(counts).forEach(([key, value]) => {
        console.log(`  - ${value} ${key}`);
    });

    // 4. Delete catering-specific data in proper order
    console.log("\nDeleting catering data...");

    // Delete ConsumerFood first (has many relations and references Client)
    const deletedConsumerFoods = await db.consumerFood.deleteMany({
        where: { cateringId: { in: cateringIdsToRemove } },
    });
    console.log(`  - Deleted ${deletedConsumerFoods.count} ConsumerFood records`);

    // 5. Delete role-specific records for users (after ConsumerFood)
    console.log("\nDeleting user role records...");

    const deletedManagers = await db.manager.deleteMany({
        where: { userId: { in: userIdsToRemove } },
    });
    console.log(`  - Deleted ${deletedManagers.count} Manager records`);

    const deletedKitchens = await db.kitchen.deleteMany({
        where: { userId: { in: userIdsToRemove } },
    });
    console.log(`  - Deleted ${deletedKitchens.count} Kitchen records`);

    const deletedDieticians = await db.dietician.deleteMany({
        where: { userId: { in: userIdsToRemove } },
    });
    console.log(`  - Deleted ${deletedDieticians.count} Dietician records`);

    const deletedClientRoles = await db.client.deleteMany({
        where: { userId: { in: userIdsToRemove } },
    });
    console.log(`  - Deleted ${deletedClientRoles.count} Client role records`);

    // 6. Continue with remaining catering data
    console.log("\nDeleting remaining catering data...");

    // Delete RegularMenu (will cascade delete MenuMealFood)
    const deletedRegularMenus = await db.regularMenu.deleteMany({
        where: { cateringId: { in: cateringIdsToRemove } },
    });
    console.log(`  - Deleted ${deletedRegularMenus.count} RegularMenu records`);

    // Delete Orders (will cascade delete OrderConsumer* records)
    const deletedOrders = await db.order.deleteMany({
        where: { cateringId: { in: cateringIdsToRemove } },
    });
    console.log(`  - Deleted ${deletedOrders.count} Order records`);

    // Delete Consumers (will cascade delete ConsumerAllergen)
    const deletedConsumers = await db.consumer.deleteMany({
        where: { cateringId: { in: cateringIdsToRemove } },
    });
    console.log(`  - Deleted ${deletedConsumers.count} Consumer records`);

    // Delete ClientFiles
    const deletedClientFiles = await db.clientFile.deleteMany({
        where: { cateringId: { in: cateringIdsToRemove } },
    });
    console.log(`  - Deleted ${deletedClientFiles.count} ClientFile records`);

    // Delete Exclusions (will cascade delete ExclusionAllergen)
    const deletedExclusions = await db.exclusion.deleteMany({
        where: { cateringId: { in: cateringIdsToRemove } },
    });
    console.log(`  - Deleted ${deletedExclusions.count} Exclusion records`);

    // Delete Food (will cascade delete FoodAllergen)
    const deletedFood = await db.food.deleteMany({
        where: { cateringId: { in: cateringIdsToRemove } },
    });
    console.log(`  - Deleted ${deletedFood.count} Food records`);

    // Delete Allergens
    const deletedAllergens = await db.allergen.deleteMany({
        where: { cateringId: { in: cateringIdsToRemove } },
    });
    console.log(`  - Deleted ${deletedAllergens.count} Allergen records`);

    // Delete Meals
    const deletedMeals = await db.meal.deleteMany({
        where: { cateringId: { in: cateringIdsToRemove } },
    });
    console.log(`  - Deleted ${deletedMeals.count} Meal records`);

    // Delete MealCategories
    const deletedMealCategories = await db.mealCategory.deleteMany({
        where: { cateringId: { in: cateringIdsToRemove } },
    });
    console.log(`  - Deleted ${deletedMealCategories.count} MealCategory records`);

    // Delete FoodCategories
    const deletedFoodCategories = await db.foodCategory.deleteMany({
        where: { cateringId: { in: cateringIdsToRemove } },
    });
    console.log(`  - Deleted ${deletedFoodCategories.count} FoodCategory records`);

    // Delete DeliveryRoutes
    const deletedDeliveryRoutes = await db.deliveryRoute.deleteMany({
        where: { cateringId: { in: cateringIdsToRemove } },
    });
    console.log(`  - Deleted ${deletedDeliveryRoutes.count} DeliveryRoute records`);

    // 7. Delete Clipboard records (references User)
    console.log("\nDeleting clipboard records...");
    const deletedClipboards = await db.clipboard.deleteMany({
        where: { userId: { in: userIdsToRemove } },
    });
    console.log(`  - Deleted ${deletedClipboards.count} Clipboard records`);

    // 8. Clear inviter relationships (self-referencing User relation)
    console.log("\nClearing inviter relationships...");
    const updatedInviterRefs = await db.user.updateMany({
        where: { inviterId: { in: userIdsToRemove } },
        data: { inviterId: null },
    });
    console.log(`  - Cleared ${updatedInviterRefs.count} inviter references`);

    // 9. Delete Users (will cascade delete Account and Session)
    console.log("\nDeleting users and their accounts...");
    const deletedUsers = await db.user.deleteMany({
        where: { id: { in: userIdsToRemove } },
    });
    console.log(`  - Deleted ${deletedUsers.count} User records (including Account and Session via cascade)`);

    // 10. Finally, delete the Caterings themselves
    console.log("\nDeleting caterings...");
    const deletedCaterings = await db.catering.deleteMany({
        where: { id: { in: cateringIdsToRemove } },
    });
    console.log(`  - Deleted ${deletedCaterings.count} Catering records`);

    console.log("\n=== Catering removal process completed ===");
};

export default removeCateringsExcept;