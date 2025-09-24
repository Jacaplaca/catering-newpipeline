import cleanCateringData from '@root/app/server/api/routers/specific/libs/devTools/cleanCateringDataWithClients';
import { db } from '@root/app/server/db';
import log from '@root/app/lib/log';
import { env } from '@root/app/env';

const isLogOn = env.DEV_TOOLS_LOG;
const localLog = (message: string) => log(message, isLogOn);

const COPY_ORDERS = true; // Set to false to skip copying orders and related tables
const DAYS_ORDER = 30; // Number of days back from today to copy orders (e.g., 30 = orders not older than 30 days)
const COPY_REGULAR_MENUS = true; // Set to false to skip copying regular menus and related tables
const DAYS_REGULAR_MENU = 30; // Number of days back from today to copy regular menus (e.g., 30 = menus not older than 30 days)

const copyCateringDataToOther = async ({
    sourceCateringId,
    destinationCateringId,
}: {
    sourceCateringId: string;
    destinationCateringId: string;
}) => {



    const cateringIdToCopyOrigin = sourceCateringId; //ekoplanet
    const cateringIdToCopyDestination = destinationCateringId; //damian

    try {
        // Clean destination catering first
        await cleanCateringData(cateringIdToCopyDestination);

        // Get manager email from destination catering for creating new user emails
        const destinationManager = await db.manager.findFirst({
            where: {
                cateringId: cateringIdToCopyDestination,
            },
            include: {
                user: true,
            }
        });

        const managerEmail = destinationManager?.user?.email;
        const passwordHash = destinationManager?.user?.passwordHash;
        if (!managerEmail) {
            throw new Error("Manager email not found for destination catering");
        }

        // Get all clients from origin catering
        const clientsToCopy = await db.client.findMany({
            where: {
                cateringId: cateringIdToCopyOrigin,
            },
            include: {
                user: true,
            }
        });

        localLog(`Found ${clientsToCopy.length} clients to copy from origin catering`);

        // Extract base email (part before @)
        const emailParts = managerEmail.split('@');
        const baseEmail = emailParts[0];
        const domain = emailParts[1];

        let copiedClientsCount = 0;

        // Create mapping objects to track original -> new IDs
        const clientIdMapping: Record<string, string> = {};
        const userIdMapping: Record<string, string> = {};

        // Copy each client
        for (const [index, clientToCopy] of clientsToCopy.entries()) {
            const clientNumber = index + 1;
            const newUserEmail = `${baseEmail}+copied-client-${clientNumber}@${domain}`;

            localLog(`Copying client ${clientNumber}/${clientsToCopy.length}: ${clientToCopy.user.email} -> ${newUserEmail}`);

            // Create new user
            const newUser = await db.user.create({
                data: {
                    email: newUserEmail,
                    name: clientToCopy.user.name,
                    image: clientToCopy.user.image,
                    passwordHash,
                    roleId: clientToCopy.user.roleId,
                    cateringId: cateringIdToCopyDestination,
                    inviterId: clientToCopy.user.inviterId,
                    web3Address: clientToCopy.user.web3Address,
                }
            });

            // Create account for new user (copy from original user's account if exists)
            const originalAccount = await db.account.findFirst({
                where: {
                    userId: clientToCopy.userId,
                }
            });

            if (originalAccount) {
                await db.account.create({
                    data: {
                        userId: newUser.id,
                        type: originalAccount.type,
                        provider: originalAccount.provider,
                        providerAccountId: `${originalAccount.providerAccountId}_copied_${clientNumber}`, // Make it unique
                        refresh_token: originalAccount.refresh_token,
                        access_token: originalAccount.access_token,
                        expires_at: originalAccount.expires_at,
                        token_type: originalAccount.token_type,
                        scope: originalAccount.scope,
                        id_token: originalAccount.id_token,
                        session_state: originalAccount.session_state,
                    }
                });
            }

            // Create new client
            const newClient = await db.client.create({
                data: {
                    userId: newUser.id,
                    cateringId: cateringIdToCopyDestination,
                    settings: clientToCopy.settings,
                    info: clientToCopy.info,
                    name: clientToCopy.name,
                    deliveryRouteId: null, // Will be set later when delivery routes are copied
                    deactivated: clientToCopy.deactivated,
                    labelOrder: clientToCopy.labelOrder,
                }
            });

            // Store mappings for later use
            clientIdMapping[clientToCopy.id] = newClient.id;
            userIdMapping[clientToCopy.userId] = newUser.id;

            copiedClientsCount++;
            localLog(`Successfully copied client ${clientNumber}: ${newClient.id}`);
        }

        localLog(`Successfully copied ${copiedClientsCount} clients. Now copying consumers...`);

        // Get all dieticians from destination catering to assign randomly
        const destinationDieticians = await db.dietician.findMany({
            where: {
                cateringId: cateringIdToCopyDestination,
            }
        });

        if (destinationDieticians.length === 0) {
            throw new Error("No dieticians found in destination catering. Cannot copy consumers.");
        }

        localLog(`Found ${destinationDieticians.length} dieticians in destination catering`);

        // Get all consumers from origin catering
        const consumersToCopy = await db.consumer.findMany({
            where: {
                cateringId: cateringIdToCopyOrigin,
            }
        });

        localLog(`Found ${consumersToCopy.length} consumers to copy from origin catering`);

        const consumerIdMapping: Record<string, string> = {};
        let copiedConsumersCount = 0;

        // Copy each consumer
        for (const [index, consumerToCopy] of consumersToCopy.entries()) {
            const consumerNumber = index + 1;

            // Find the corresponding new client ID
            const newClientId = clientIdMapping[consumerToCopy.clientId];
            if (!newClientId) {
                localLog(`Warning: Client mapping not found for consumer ${consumerToCopy.id}, skipping...`);
                continue;
            }

            // Assign random dietician from destination catering
            const randomDietician = destinationDieticians[Math.floor(Math.random() * destinationDieticians.length)];

            if (!randomDietician) {
                localLog(`Error: Could not select dietician for consumer ${consumerToCopy.id}, skipping...`);
                continue;
            }

            localLog(`Copying consumer ${consumerNumber}/${consumersToCopy.length}: ${consumerToCopy.name ?? consumerToCopy.code ?? 'unnamed'}`);

            // Create new consumer
            const newConsumer = await db.consumer.create({
                data: {
                    code: consumerToCopy.code,
                    clientId: newClientId,
                    name: consumerToCopy.name,
                    notes: consumerToCopy.notes,
                    dieticianId: randomDietician.id,
                    diet: consumerToCopy.diet,
                    cateringId: cateringIdToCopyDestination,
                    deactivated: consumerToCopy.deactivated,
                }
            });

            // Store mapping for later use
            consumerIdMapping[consumerToCopy.id] = newConsumer.id;

            copiedConsumersCount++;
            localLog(`Successfully copied consumer ${consumerNumber}: ${newConsumer.id} -> Client: ${newClientId}, Dietician: ${randomDietician.id}`);
        }

        localLog(`Successfully copied ${copiedConsumersCount} consumers. Now copying allergens...`);

        // Get all allergens from origin catering
        const allergensToCopy = await db.allergen.findMany({
            where: {
                cateringId: cateringIdToCopyOrigin,
            }
        });

        localLog(`Found ${allergensToCopy.length} allergens to copy from origin catering`);

        const allergenIdMapping: Record<string, string> = {};
        let copiedAllergensCount = 0;

        // Copy each allergen
        for (const [index, allergenToCopy] of allergensToCopy.entries()) {
            const allergenNumber = index + 1;

            localLog(`Copying allergen ${allergenNumber}/${allergensToCopy.length}: ${allergenToCopy.name}`);

            // Create new allergen
            const newAllergen = await db.allergen.create({
                data: {
                    name: allergenToCopy.name,
                    cateringId: cateringIdToCopyDestination,
                }
            });

            // Store mapping for later use
            allergenIdMapping[allergenToCopy.id] = newAllergen.id;

            copiedAllergensCount++;
            localLog(`Successfully copied allergen ${allergenNumber}: ${newAllergen.id} - ${newAllergen.name}`);
        }

        localLog(`Successfully copied ${copiedAllergensCount} allergens. Now copying consumer-allergen connections...`);

        // Get all consumer-allergen connections from origin catering
        const consumerAllergensToConnect = await db.consumerAllergen.findMany({
            where: {
                consumer: {
                    cateringId: cateringIdToCopyOrigin,
                }
            },
            include: {
                consumer: true,
                allergen: true,
            }
        });

        localLog(`Found ${consumerAllergensToConnect.length} consumer-allergen connections to copy`);

        let copiedConsumerAllergensCount = 0;

        // Copy each consumer-allergen connection
        for (const [index, connectionToCopy] of consumerAllergensToConnect.entries()) {
            const connectionNumber = index + 1;

            // Find corresponding new consumer and allergen IDs
            const newConsumerId = consumerIdMapping[connectionToCopy.consumerId];
            const newAllergenId = allergenIdMapping[connectionToCopy.allergenId];

            if (!newConsumerId) {
                localLog(`Warning: Consumer mapping not found for connection ${connectionToCopy.id} (consumer: ${connectionToCopy.consumerId}), skipping...`);
                continue;
            }

            if (!newAllergenId) {
                localLog(`Warning: Allergen mapping not found for connection ${connectionToCopy.id} (allergen: ${connectionToCopy.allergenId}), skipping...`);
                continue;
            }

            localLog(`Copying consumer-allergen connection ${connectionNumber}/${consumerAllergensToConnect.length}: Consumer ${newConsumerId} -> Allergen ${newAllergenId}`);

            // Create new consumer-allergen connection
            await db.consumerAllergen.create({
                data: {
                    consumerId: newConsumerId,
                    allergenId: newAllergenId,
                }
            });

            copiedConsumerAllergensCount++;
        }

        localLog(`Successfully copied ${copiedConsumerAllergensCount} consumer-allergen connections. Now copying exclusions...`);

        // Get all exclusions from origin catering
        const exclusionsToCopy = await db.exclusion.findMany({
            where: {
                cateringId: cateringIdToCopyOrigin,
            }
        });

        localLog(`Found ${exclusionsToCopy.length} exclusions to copy from origin catering`);

        const exclusionIdMapping: Record<string, string> = {};
        let copiedExclusionsCount = 0;

        // Copy each exclusion
        for (const [index, exclusionToCopy] of exclusionsToCopy.entries()) {
            const exclusionNumber = index + 1;

            localLog(`Copying exclusion ${exclusionNumber}/${exclusionsToCopy.length}: ${exclusionToCopy.name}`);

            // Create new exclusion
            const newExclusion = await db.exclusion.create({
                data: {
                    name: exclusionToCopy.name,
                    cateringId: cateringIdToCopyDestination,
                }
            });

            // Store mapping for later use
            exclusionIdMapping[exclusionToCopy.id] = newExclusion.id;

            copiedExclusionsCount++;
            localLog(`Successfully copied exclusion ${exclusionNumber}: ${newExclusion.id} - ${newExclusion.name}`);
        }

        localLog(`Successfully copied ${copiedExclusionsCount} exclusions. Now copying exclusion-allergen connections...`);

        // Get all exclusion-allergen connections from origin catering
        const exclusionAllergensToConnect = await db.exclusionAllergen.findMany({
            where: {
                exclusion: {
                    cateringId: cateringIdToCopyOrigin,
                }
            },
            include: {
                exclusion: true,
                allergen: true,
            }
        });

        localLog(`Found ${exclusionAllergensToConnect.length} exclusion-allergen connections to copy`);

        let copiedExclusionAllergensCount = 0;

        // Copy each exclusion-allergen connection
        for (const [index, connectionToCopy] of exclusionAllergensToConnect.entries()) {
            const connectionNumber = index + 1;

            // Find corresponding new exclusion and allergen IDs
            const newExclusionId = exclusionIdMapping[connectionToCopy.exclusionId];
            const newAllergenId = allergenIdMapping[connectionToCopy.allergenId];

            if (!newExclusionId) {
                localLog(`Warning: Exclusion mapping not found for connection ${connectionToCopy.id} (exclusion: ${connectionToCopy.exclusionId}), skipping...`);
                continue;
            }

            if (!newAllergenId) {
                localLog(`Warning: Allergen mapping not found for connection ${connectionToCopy.id} (allergen: ${connectionToCopy.allergenId}), skipping...`);
                continue;
            }

            localLog(`Copying exclusion-allergen connection ${connectionNumber}/${exclusionAllergensToConnect.length}: Exclusion ${newExclusionId} -> Allergen ${newAllergenId}`);

            // Create new exclusion-allergen connection
            await db.exclusionAllergen.create({
                data: {
                    exclusionId: newExclusionId,
                    allergenId: newAllergenId,
                }
            });

            copiedExclusionAllergensCount++;
        }

        localLog(`Successfully copied ${copiedExclusionAllergensCount} exclusion-allergen connections. Now copying food categories...`);

        // Get all food categories from origin catering
        const foodCategoriesToCopy = await db.foodCategory.findMany({
            where: {
                cateringId: cateringIdToCopyOrigin,
            }
        });

        localLog(`Found ${foodCategoriesToCopy.length} food categories to copy from origin catering`);

        const foodCategoryIdMapping: Record<string, string> = {};
        let copiedFoodCategoriesCount = 0;

        // Copy each food category
        for (const [index, categoryToCopy] of foodCategoriesToCopy.entries()) {
            const categoryNumber = index + 1;

            localLog(`Copying food category ${categoryNumber}/${foodCategoriesToCopy.length}: ${categoryToCopy.name}`);

            // Create new food category
            const newFoodCategory = await db.foodCategory.create({
                data: {
                    name: categoryToCopy.name,
                    cateringId: cateringIdToCopyDestination,
                }
            });

            // Store mapping for later use
            foodCategoryIdMapping[categoryToCopy.id] = newFoodCategory.id;

            copiedFoodCategoriesCount++;
            localLog(`Successfully copied food category ${categoryNumber}: ${newFoodCategory.id} - ${newFoodCategory.name}`);
        }

        localLog(`Successfully copied ${copiedFoodCategoriesCount} food categories. Now copying food items...`);

        // Get all food items from origin catering
        const foodToCopy = await db.food.findMany({
            where: {
                cateringId: cateringIdToCopyOrigin,
            },
            include: {
                foodCategory: true,
            }
        });

        localLog(`Found ${foodToCopy.length} food items to copy from origin catering`);

        const foodIdMapping: Record<string, string> = {};
        let copiedFoodCount = 0;

        // Copy each food item
        for (const [index, foodItemToCopy] of foodToCopy.entries()) {
            const foodNumber = index + 1;

            // Find corresponding new food category ID if the food has a category
            let newFoodCategoryId: string | null = null;
            if (foodItemToCopy.foodCategoryId) {
                newFoodCategoryId = foodCategoryIdMapping[foodItemToCopy.foodCategoryId] ?? null;
                if (!newFoodCategoryId) {
                    localLog(`Warning: Food category mapping not found for food ${foodItemToCopy.id} (category: ${foodItemToCopy.foodCategoryId}), setting category to null`);
                }
            }

            localLog(`Copying food item ${foodNumber}/${foodToCopy.length}: ${foodItemToCopy.name}${foodItemToCopy.foodCategory ? ` (category: ${foodItemToCopy.foodCategory.name})` : ' (no category)'}`);

            // Create new food item
            const newFood = await db.food.create({
                data: {
                    name: foodItemToCopy.name,
                    ingredients: foodItemToCopy.ingredients,
                    foodCategoryId: newFoodCategoryId,
                    cateringId: cateringIdToCopyDestination,
                }
            });

            // Store mapping for later use
            foodIdMapping[foodItemToCopy.id] = newFood.id;

            copiedFoodCount++;
            localLog(`Successfully copied food item ${foodNumber}: ${newFood.id} - ${newFood.name}${newFoodCategoryId ? ` -> Category: ${newFoodCategoryId}` : ' (no category)'}`);
        }

        localLog(`Successfully copied ${copiedFoodCount} food items. Now copying food-allergen connections...`);

        // Get all food-allergen connections from origin catering
        const foodAllergensToConnect = await db.foodAllergen.findMany({
            where: {
                food: {
                    cateringId: cateringIdToCopyOrigin,
                }
            },
            include: {
                food: true,
                allergen: true,
            }
        });

        localLog(`Found ${foodAllergensToConnect.length} food-allergen connections to copy`);

        let copiedFoodAllergensCount = 0;

        // Copy each food-allergen connection
        for (const [index, connectionToCopy] of foodAllergensToConnect.entries()) {
            const connectionNumber = index + 1;

            // Find corresponding new food and allergen IDs
            const newFoodId = foodIdMapping[connectionToCopy.foodId];
            const newAllergenId = allergenIdMapping[connectionToCopy.allergenId];

            if (!newFoodId) {
                localLog(`Warning: Food mapping not found for connection ${connectionToCopy.id} (food: ${connectionToCopy.foodId}), skipping...`);
                continue;
            }

            if (!newAllergenId) {
                localLog(`Warning: Allergen mapping not found for connection ${connectionToCopy.id} (allergen: ${connectionToCopy.allergenId}), skipping...`);
                continue;
            }

            localLog(`Copying food-allergen connection ${connectionNumber}/${foodAllergensToConnect.length}: Food ${newFoodId} -> Allergen ${newAllergenId}`);

            // Create new food-allergen connection
            await db.foodAllergen.create({
                data: {
                    foodId: newFoodId,
                    allergenId: newAllergenId,
                }
            });

            copiedFoodAllergensCount++;
        }

        localLog(`Successfully copied ${copiedFoodAllergensCount} food-allergen connections. Now copying meals...`);

        // Get all meals from origin catering
        const mealsToCopy = await db.meal.findMany({
            where: {
                cateringId: cateringIdToCopyOrigin,
            }
        });

        localLog(`Found ${mealsToCopy.length} meals to copy from origin catering`);

        const mealIdMapping: Record<string, string> = {};
        let copiedMealsCount = 0;

        // Copy each meal
        for (const [index, mealToCopy] of mealsToCopy.entries()) {
            const mealNumber = index + 1;

            localLog(`Copying meal ${mealNumber}/${mealsToCopy.length}: ${mealToCopy.name}`);

            // Create new meal
            const newMeal = await db.meal.create({
                data: {
                    name: mealToCopy.name,
                    separateLabel: mealToCopy.separateLabel,
                    cateringId: cateringIdToCopyDestination,
                    mealCategoryId: mealToCopy.mealCategoryId, // Note: We're not copying meal categories yet, so this might be null or invalid
                    mealGroupId: mealToCopy.mealGroupId, // Note: We're not copying meal groups yet, so this might be null or invalid
                }
            });

            // Store mapping for later use
            mealIdMapping[mealToCopy.id] = newMeal.id;

            copiedMealsCount++;
            localLog(`Successfully copied meal ${mealNumber}: ${newMeal.id} - ${newMeal.name}`);
        }

        localLog(`Successfully copied ${copiedMealsCount} meals. Now copying delivery routes...`);

        // Get all delivery routes from origin catering
        const deliveryRoutesToCopy = await db.deliveryRoute.findMany({
            where: {
                cateringId: cateringIdToCopyOrigin,
            }
        });

        localLog(`Found ${deliveryRoutesToCopy.length} delivery routes to copy from origin catering`);

        const deliveryRouteIdMapping: Record<string, string> = {};
        let copiedDeliveryRoutesCount = 0;

        // Copy each delivery route
        for (const [index, routeToCopy] of deliveryRoutesToCopy.entries()) {
            const routeNumber = index + 1;

            localLog(`Copying delivery route ${routeNumber}/${deliveryRoutesToCopy.length}: ${routeToCopy.code} - ${routeToCopy.name}`);

            // Create new delivery route
            const newDeliveryRoute = await db.deliveryRoute.create({
                data: {
                    code: routeToCopy.code,
                    name: routeToCopy.name,
                    cateringId: cateringIdToCopyDestination,
                }
            });

            // Store mapping for later use
            deliveryRouteIdMapping[routeToCopy.id] = newDeliveryRoute.id;

            copiedDeliveryRoutesCount++;
            localLog(`Successfully copied delivery route ${routeNumber}: ${newDeliveryRoute.id} - ${routeToCopy.code} (${routeToCopy.name})`);
        }

        localLog(`Successfully copied ${copiedDeliveryRoutesCount} delivery routes. Now updating clients with delivery routes...`);

        // Update clients that have delivery routes assigned
        let updatedClientsWithRoutesCount = 0;

        for (const [originalClientId, newClientId] of Object.entries(clientIdMapping)) {
            // Get original client's delivery route
            const originalClient = await db.client.findUnique({
                where: { id: originalClientId },
                select: { deliveryRouteId: true }
            });

            if (originalClient?.deliveryRouteId) {
                // Find corresponding new delivery route ID
                const newDeliveryRouteId = deliveryRouteIdMapping[originalClient.deliveryRouteId];

                if (newDeliveryRouteId) {
                    // Update the new client with the corresponding delivery route
                    await db.client.update({
                        where: { id: newClientId },
                        data: { deliveryRouteId: newDeliveryRouteId }
                    });

                    updatedClientsWithRoutesCount++;
                    localLog(`Updated client ${newClientId} with delivery route ${newDeliveryRouteId}`);
                } else {
                    localLog(`Warning: Delivery route mapping not found for client ${newClientId} (original route: ${originalClient.deliveryRouteId})`);
                }
            }
        }

        localLog(`Successfully updated ${updatedClientsWithRoutesCount} clients with delivery routes.`);

        // Conditionally copy regular menus and related tables
        let copiedRegularMenusCount = 0;
        let copiedMenuMealFoodsCount = 0;
        let copiedConsumerFoodsCount = 0;
        let copiedConsumerFoodExclusionsCount = 0;
        const regularMenuIdMapping: Record<string, string> = {};
        const consumerFoodIdMapping: Record<string, string> = {};

        if (COPY_REGULAR_MENUS) {
            localLog(`COPY_REGULAR_MENUS is enabled. Starting to copy regular menus from the last ${DAYS_REGULAR_MENU} days...`);

            // Calculate the cutoff date (DAYS_REGULAR_MENU days ago)
            const menuCutoffDate = new Date();
            menuCutoffDate.setDate(menuCutoffDate.getDate() - DAYS_REGULAR_MENU);

            localLog(`Regular menus cutoff date: ${menuCutoffDate.toISOString()} (${DAYS_REGULAR_MENU} days ago)`);
            localLog(`Menu cutoff: Year ${menuCutoffDate.getFullYear()}, Month ${menuCutoffDate.getMonth()} (0-indexed), Day ${menuCutoffDate.getDate()}`);

            // Get all regular menus from origin catering
            const allRegularMenusFromOrigin = await db.regularMenu.findMany({
                where: {
                    cateringId: cateringIdToCopyOrigin,
                }
            });

            localLog(`Found ${allRegularMenusFromOrigin.length} total regular menus from origin catering. Filtering by date...`);

            // Filter regular menus by day (last DAYS_REGULAR_MENU days)
            const regularMenusToCopy = allRegularMenusFromOrigin.filter(menu => {
                // Convert day to Date object (remember month is 0-indexed in day)
                const menuDate = new Date(menu.day.year, menu.day.month, menu.day.day);

                // Check if menu is within the last DAYS_REGULAR_MENU days
                const isWithinRange = menuDate >= menuCutoffDate;

                if (!isWithinRange) {
                    localLog(`Skipping old regular menu: ${menu.id} (date: ${menuDate.toISOString().split('T')[0]})`);
                }

                return isWithinRange;
            });

            localLog(`After date filtering: ${regularMenusToCopy.length} regular menus to copy (skipped ${allRegularMenusFromOrigin.length - regularMenusToCopy.length} old menus)`);

            // Copy each regular menu
            for (const [index, menuToCopy] of regularMenusToCopy.entries()) {
                const menuNumber = index + 1;

                // Find corresponding new client ID if menu has a clientId
                let newClientId: string | null = null;
                if (menuToCopy.clientId) {
                    newClientId = clientIdMapping[menuToCopy.clientId] ?? null;
                    if (!newClientId) {
                        localLog(`Warning: Client mapping not found for regular menu ${menuToCopy.id} (client: ${menuToCopy.clientId}), skipping...`);
                        continue;
                    }
                }

                localLog(`Copying regular menu ${menuNumber}/${regularMenusToCopy.length}: ${menuToCopy.id}${menuToCopy.clientId ? ` for client ${newClientId}` : ' (global menu)'}`);

                // Create new regular menu
                const newRegularMenu = await db.regularMenu.create({
                    data: {
                        day: menuToCopy.day,
                        cateringId: cateringIdToCopyDestination,
                        clientId: newClientId,
                    }
                });

                // Store mapping for later use
                regularMenuIdMapping[menuToCopy.id] = newRegularMenu.id;

                copiedRegularMenusCount++;
                localLog(`Successfully copied regular menu ${menuNumber}: ${newRegularMenu.id}${newClientId ? ` -> Client: ${newClientId}` : ' (global)'}`);
            }

            localLog(`Successfully copied ${copiedRegularMenusCount} regular menus. Now copying menu meal foods...`);

            // Get all menu meal foods from origin regular menus
            const menuMealFoodsToConnect = await db.menuMealFood.findMany({
                where: {
                    regularMenu: {
                        cateringId: cateringIdToCopyOrigin,
                        // Also filter by date here
                        id: {
                            in: regularMenusToCopy.map(menu => menu.id)
                        }
                    }
                },
                include: {
                    regularMenu: true,
                    meal: true,
                    food: true,
                }
            });

            localLog(`Found ${menuMealFoodsToConnect.length} menu meal food connections to copy`);

            // Copy each menu meal food connection
            for (const [index, connectionToCopy] of menuMealFoodsToConnect.entries()) {
                const connectionNumber = index + 1;

                // Find corresponding new IDs
                const newRegularMenuId = regularMenuIdMapping[connectionToCopy.regularMenuId];
                const newMealId = mealIdMapping[connectionToCopy.mealId];
                const newFoodId = foodIdMapping[connectionToCopy.foodId];

                if (!newRegularMenuId) {
                    localLog(`Warning: Regular menu mapping not found for connection ${connectionToCopy.id} (menu: ${connectionToCopy.regularMenuId}), skipping...`);
                    continue;
                }

                if (!newMealId) {
                    localLog(`Warning: Meal mapping not found for connection ${connectionToCopy.id} (meal: ${connectionToCopy.mealId}), skipping...`);
                    continue;
                }

                if (!newFoodId) {
                    localLog(`Warning: Food mapping not found for connection ${connectionToCopy.id} (food: ${connectionToCopy.foodId}), skipping...`);
                    continue;
                }

                localLog(`Copying menu meal food connection ${connectionNumber}/${menuMealFoodsToConnect.length}: Menu ${newRegularMenuId} -> Meal ${newMealId} -> Food ${newFoodId}`);

                // Create new menu meal food connection
                await db.menuMealFood.create({
                    data: {
                        regularMenuId: newRegularMenuId,
                        mealId: newMealId,
                        foodId: newFoodId,
                        order: connectionToCopy.order,
                    }
                });

                copiedMenuMealFoodsCount++;
            }

            localLog(`Successfully copied ${copiedMenuMealFoodsCount} menu meal food connections. Now copying consumer foods...`);

            // Get all consumer foods from origin regular menus
            const consumerFoodsToConnect = await db.consumerFood.findMany({
                where: {
                    regularMenu: {
                        cateringId: cateringIdToCopyOrigin,
                        // Also filter by date here
                        id: {
                            in: regularMenusToCopy.map(menu => menu.id)
                        }
                    }
                },
                include: {
                    regularMenu: true,
                    client: true,
                    consumer: true,
                    food: true,
                    alternativeFood: true,
                    meal: true,
                }
            });

            localLog(`Found ${consumerFoodsToConnect.length} consumer food connections to copy`);

            // Copy each consumer food connection
            for (const [index, connectionToCopy] of consumerFoodsToConnect.entries()) {
                const connectionNumber = index + 1;

                // Find corresponding new IDs
                const newRegularMenuId = regularMenuIdMapping[connectionToCopy.regularMenuId];
                const newClientId = clientIdMapping[connectionToCopy.clientId];
                const newConsumerId = consumerIdMapping[connectionToCopy.consumerId];
                const newFoodId = foodIdMapping[connectionToCopy.foodId];
                const newAlternativeFoodId = connectionToCopy.alternativeFoodId ? foodIdMapping[connectionToCopy.alternativeFoodId] : null;
                const newMealId = mealIdMapping[connectionToCopy.mealId];

                if (!newRegularMenuId) {
                    localLog(`Warning: Regular menu mapping not found for consumer food ${connectionToCopy.id} (menu: ${connectionToCopy.regularMenuId}), skipping...`);
                    continue;
                }

                if (!newClientId) {
                    localLog(`Warning: Client mapping not found for consumer food ${connectionToCopy.id} (client: ${connectionToCopy.clientId}), skipping...`);
                    continue;
                }

                if (!newConsumerId) {
                    localLog(`Warning: Consumer mapping not found for consumer food ${connectionToCopy.id} (consumer: ${connectionToCopy.consumerId}), skipping...`);
                    continue;
                }

                if (!newFoodId) {
                    localLog(`Warning: Food mapping not found for consumer food ${connectionToCopy.id} (food: ${connectionToCopy.foodId}), skipping...`);
                    continue;
                }

                if (!newMealId) {
                    localLog(`Warning: Meal mapping not found for consumer food ${connectionToCopy.id} (meal: ${connectionToCopy.mealId}), skipping...`);
                    continue;
                }

                if (connectionToCopy.alternativeFoodId && !newAlternativeFoodId) {
                    localLog(`Warning: Alternative food mapping not found for consumer food ${connectionToCopy.id} (altFood: ${connectionToCopy.alternativeFoodId}), setting to null`);
                }

                // Map ignored allergens from old IDs to new IDs
                const mappedIgnoredAllergens = connectionToCopy.ignoredAllergens.map(oldAllergenId => {
                    const newAllergenId = allergenIdMapping[oldAllergenId];
                    if (!newAllergenId) {
                        localLog(`Warning: Ignored allergen mapping not found for consumer food ${connectionToCopy.id} (allergen: ${oldAllergenId}), excluding from list`);
                        return null;
                    }
                    return newAllergenId;
                }).filter(Boolean) as string[]; // Remove null values

                localLog(`Copying consumer food connection ${connectionNumber}/${consumerFoodsToConnect.length}: Consumer ${newConsumerId} -> Food ${newFoodId} in Menu ${newRegularMenuId}${connectionToCopy.ignoredAllergens.length > 0 ? ` (${connectionToCopy.ignoredAllergens.length} ignored allergens -> ${mappedIgnoredAllergens.length} mapped)` : ''}`);

                // Create new consumer food connection
                const newConsumerFood = await db.consumerFood.create({
                    data: {
                        regularMenuId: newRegularMenuId,
                        clientId: newClientId,
                        cateringId: cateringIdToCopyDestination,
                        consumerId: newConsumerId,
                        foodId: newFoodId,
                        alternativeFoodId: newAlternativeFoodId,
                        mealId: newMealId,
                        comment: connectionToCopy.comment,
                        ignoredAllergens: mappedIgnoredAllergens,
                    }
                });

                // Store mapping for later use in consumer food exclusions
                consumerFoodIdMapping[connectionToCopy.id] = newConsumerFood.id;

                copiedConsumerFoodsCount++;
            }

            localLog(`Successfully copied ${copiedConsumerFoodsCount} consumer food connections. Now copying consumer food exclusions...`);

            // Get all consumer food exclusions from origin consumer foods (filtered by date through regular menus)
            const consumerFoodExclusionsToConnect = await db.consumerFoodExclusion.findMany({
                where: {
                    consumerFood: {
                        regularMenu: {
                            cateringId: cateringIdToCopyOrigin,
                            // Also filter by date here
                            id: {
                                in: regularMenusToCopy.map(menu => menu.id)
                            }
                        }
                    }
                },
                include: {
                    consumerFood: {
                        include: {
                            regularMenu: true,
                        }
                    },
                    exclusion: true,
                }
            });

            localLog(`Found ${consumerFoodExclusionsToConnect.length} consumer food exclusion connections to copy`);

            // Copy each consumer food exclusion connection
            for (const [index, connectionToCopy] of consumerFoodExclusionsToConnect.entries()) {
                const connectionNumber = index + 1;

                // Find corresponding new IDs
                const newConsumerFoodId = consumerFoodIdMapping[connectionToCopy.consumerFoodId];
                const newExclusionId = exclusionIdMapping[connectionToCopy.exclusionId];

                if (!newConsumerFoodId) {
                    localLog(`Warning: Consumer food mapping not found for exclusion connection ${connectionToCopy.id} (consumerFood: ${connectionToCopy.consumerFoodId}), skipping...`);
                    continue;
                }

                if (!newExclusionId) {
                    localLog(`Warning: Exclusion mapping not found for exclusion connection ${connectionToCopy.id} (exclusion: ${connectionToCopy.exclusionId}), skipping...`);
                    continue;
                }

                localLog(`Copying consumer food exclusion connection ${connectionNumber}/${consumerFoodExclusionsToConnect.length}: ConsumerFood ${newConsumerFoodId} -> Exclusion ${newExclusionId}`);

                // Create new consumer food exclusion connection
                await db.consumerFoodExclusion.create({
                    data: {
                        consumerFoodId: newConsumerFoodId,
                        exclusionId: newExclusionId,
                    }
                });

                copiedConsumerFoodExclusionsCount++;
            }

            localLog(`Successfully copied ${copiedConsumerFoodExclusionsCount} consumer food exclusion connections.`);
        } else {
            localLog(`COPY_REGULAR_MENUS is disabled. Skipping regular menus and related tables.`);
        }

        // Conditionally copy orders and related tables
        let copiedOrdersCount = 0;
        let copiedOrderBreakfastCount = 0;
        let copiedOrderLunchCount = 0;
        let copiedOrderDinnerCount = 0;
        let copiedOrderLunchBDCount = 0;
        let copiedOrderDinnerBDCount = 0;
        const orderIdMapping: Record<string, string> = {};

        if (COPY_ORDERS) {
            localLog(`COPY_ORDERS is enabled. Starting to copy orders from the last ${DAYS_ORDER} days...`);

            // Calculate the cutoff date (DAYS_ORDER days ago)
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - DAYS_ORDER);

            localLog(`Orders cutoff date: ${cutoffDate.toISOString()} (${DAYS_ORDER} days ago)`);
            localLog(`Cutoff: Year ${cutoffDate.getFullYear()}, Month ${cutoffDate.getMonth()} (0-indexed), Day ${cutoffDate.getDate()}`);

            // Get all orders from origin catering
            const allOrdersFromOrigin = await db.order.findMany({
                where: {
                    cateringId: cateringIdToCopyOrigin,
                }
            });

            localLog(`Found ${allOrdersFromOrigin.length} total orders from origin catering. Filtering by date...`);

            // Filter orders by deliveryDay (last DAYS_ORDER days)
            const ordersToCopy = allOrdersFromOrigin.filter(order => {
                // Convert deliveryDay to Date object (remember month is 0-indexed in deliveryDay)
                const orderDate = new Date(order.deliveryDay.year, order.deliveryDay.month, order.deliveryDay.day);

                // Check if order is within the last DAYS_ORDER days
                const isWithinRange = orderDate >= cutoffDate;

                if (!isWithinRange) {
                    localLog(`Skipping old order: ${order.id} (delivery: ${orderDate.toISOString().split('T')[0]})`);
                }

                return isWithinRange;
            });

            localLog(`After date filtering: ${ordersToCopy.length} orders to copy (skipped ${allOrdersFromOrigin.length - ordersToCopy.length} old orders)`);

            // Copy each order
            for (const [index, orderToCopy] of ordersToCopy.entries()) {
                const orderNumber = index + 1;

                // Find corresponding new client ID
                const newClientId = clientIdMapping[orderToCopy.clientId];
                if (!newClientId) {
                    localLog(`Warning: Client mapping not found for order ${orderToCopy.id} (client: ${orderToCopy.clientId}), skipping...`);
                    continue;
                }

                localLog(`Copying order ${orderNumber}/${ordersToCopy.length}: ${orderToCopy.id} for client ${newClientId}`);

                // Create new order
                const newOrder = await db.order.create({
                    data: {
                        cateringId: cateringIdToCopyDestination,
                        clientId: newClientId,
                        status: orderToCopy.status,
                        breakfastStandard: orderToCopy.breakfastStandard,
                        lunchStandard: orderToCopy.lunchStandard,
                        dinnerStandard: orderToCopy.dinnerStandard,
                        breakfastDietCount: orderToCopy.breakfastDietCount,
                        lunchDietCount: orderToCopy.lunchDietCount,
                        dinnerDietCount: orderToCopy.dinnerDietCount,
                        lunchStandardBeforeDeadline: orderToCopy.lunchStandardBeforeDeadline,
                        dinnerStandardBeforeDeadline: orderToCopy.dinnerStandardBeforeDeadline,
                        lunchDietCountBeforeDeadline: orderToCopy.lunchDietCountBeforeDeadline,
                        dinnerDietCountBeforeDeadline: orderToCopy.dinnerDietCountBeforeDeadline,
                        deliveryDay: orderToCopy.deliveryDay,
                        sentToCateringAt: orderToCopy.sentToCateringAt,
                        notes: orderToCopy.notes,
                    }
                });

                // Store mapping for later use
                orderIdMapping[orderToCopy.id] = newOrder.id;

                copiedOrdersCount++;
                localLog(`Successfully copied order ${orderNumber}: ${newOrder.id} -> Client: ${newClientId}`);
            }

            localLog(`Successfully copied ${copiedOrdersCount} orders. Now copying order-consumer connections...`);

            // Copy OrderConsumerBreakfast (only for orders we copied)
            const orderBreakfastToCopy = await db.orderConsumerBreakfast.findMany({
                where: {
                    orderId: {
                        in: ordersToCopy.map(order => order.id)
                    }
                }
            });

            localLog(`Found ${orderBreakfastToCopy.length} order-consumer breakfast connections to copy`);

            for (const connectionToCopy of orderBreakfastToCopy) {
                const newOrderId = orderIdMapping[connectionToCopy.orderId];
                const newConsumerId = consumerIdMapping[connectionToCopy.consumerId];

                if (!newOrderId || !newConsumerId) {
                    localLog(`Warning: Missing mapping for breakfast connection ${connectionToCopy.id} (order: ${connectionToCopy.orderId}, consumer: ${connectionToCopy.consumerId}), skipping...`);
                    continue;
                }

                await db.orderConsumerBreakfast.create({
                    data: {
                        orderId: newOrderId,
                        consumerId: newConsumerId,
                    }
                });

                copiedOrderBreakfastCount++;
            }

            // Copy OrderConsumerLunch (only for orders we copied)
            const orderLunchToCopy = await db.orderConsumerLunch.findMany({
                where: {
                    orderId: {
                        in: ordersToCopy.map(order => order.id)
                    }
                }
            });

            localLog(`Found ${orderLunchToCopy.length} order-consumer lunch connections to copy`);

            for (const connectionToCopy of orderLunchToCopy) {
                const newOrderId = orderIdMapping[connectionToCopy.orderId];
                const newConsumerId = consumerIdMapping[connectionToCopy.consumerId];

                if (!newOrderId || !newConsumerId) {
                    localLog(`Warning: Missing mapping for lunch connection ${connectionToCopy.id} (order: ${connectionToCopy.orderId}, consumer: ${connectionToCopy.consumerId}), skipping...`);
                    continue;
                }

                await db.orderConsumerLunch.create({
                    data: {
                        orderId: newOrderId,
                        consumerId: newConsumerId,
                    }
                });

                copiedOrderLunchCount++;
            }

            // Copy OrderConsumerDinner (only for orders we copied)
            const orderDinnerToCopy = await db.orderConsumerDinner.findMany({
                where: {
                    orderId: {
                        in: ordersToCopy.map(order => order.id)
                    }
                }
            });

            localLog(`Found ${orderDinnerToCopy.length} order-consumer dinner connections to copy`);

            for (const connectionToCopy of orderDinnerToCopy) {
                const newOrderId = orderIdMapping[connectionToCopy.orderId];
                const newConsumerId = consumerIdMapping[connectionToCopy.consumerId];

                if (!newOrderId || !newConsumerId) {
                    localLog(`Warning: Missing mapping for dinner connection ${connectionToCopy.id} (order: ${connectionToCopy.orderId}, consumer: ${connectionToCopy.consumerId}), skipping...`);
                    continue;
                }

                await db.orderConsumerDinner.create({
                    data: {
                        orderId: newOrderId,
                        consumerId: newConsumerId,
                    }
                });

                copiedOrderDinnerCount++;
            }

            // Copy OrderConsumerLunchBeforeDeadline (only for orders we copied)
            const orderLunchBDToCopy = await db.orderConsumerLunchBeforeDeadline.findMany({
                where: {
                    orderId: {
                        in: ordersToCopy.map(order => order.id)
                    }
                }
            });

            localLog(`Found ${orderLunchBDToCopy.length} order-consumer lunch before deadline connections to copy`);

            for (const connectionToCopy of orderLunchBDToCopy) {
                const newOrderId = orderIdMapping[connectionToCopy.orderId];
                const newConsumerId = consumerIdMapping[connectionToCopy.consumerId];

                if (!newOrderId || !newConsumerId) {
                    localLog(`Warning: Missing mapping for lunch BD connection ${connectionToCopy.id} (order: ${connectionToCopy.orderId}, consumer: ${connectionToCopy.consumerId}), skipping...`);
                    continue;
                }

                await db.orderConsumerLunchBeforeDeadline.create({
                    data: {
                        orderId: newOrderId,
                        consumerId: newConsumerId,
                    }
                });

                copiedOrderLunchBDCount++;
            }

            // Copy OrderConsumerDinnerBeforeDeadline (only for orders we copied)
            const orderDinnerBDToCopy = await db.orderConsumerDinnerBeforeDeadline.findMany({
                where: {
                    orderId: {
                        in: ordersToCopy.map(order => order.id)
                    }
                }
            });

            localLog(`Found ${orderDinnerBDToCopy.length} order-consumer dinner before deadline connections to copy`);

            for (const connectionToCopy of orderDinnerBDToCopy) {
                const newOrderId = orderIdMapping[connectionToCopy.orderId];
                const newConsumerId = consumerIdMapping[connectionToCopy.consumerId];

                if (!newOrderId || !newConsumerId) {
                    localLog(`Warning: Missing mapping for dinner BD connection ${connectionToCopy.id} (order: ${connectionToCopy.orderId}, consumer: ${connectionToCopy.consumerId}), skipping...`);
                    continue;
                }

                await db.orderConsumerDinnerBeforeDeadline.create({
                    data: {
                        orderId: newOrderId,
                        consumerId: newConsumerId,
                    }
                });

                copiedOrderDinnerBDCount++;
            }

            localLog(`Successfully copied all order-consumer connections: ${copiedOrderBreakfastCount} breakfast, ${copiedOrderLunchCount} lunch, ${copiedOrderDinnerCount} dinner, ${copiedOrderLunchBDCount} lunch BD, ${copiedOrderDinnerBDCount} dinner BD`);
        } else {
            localLog(`COPY_ORDERS is disabled. Skipping orders and related tables.`);
        }

        return {
            success: true,
            message: `Successfully copied ${copiedClientsCount} clients, ${copiedConsumersCount} consumers, ${copiedAllergensCount} allergens, ${copiedConsumerAllergensCount} consumer-allergen connections, ${copiedExclusionsCount} exclusions, ${copiedExclusionAllergensCount} exclusion-allergen connections, ${copiedFoodCategoriesCount} food categories, ${copiedFoodCount} food items, ${copiedFoodAllergensCount} food-allergen connections, ${copiedMealsCount} meals, ${copiedDeliveryRoutesCount} delivery routes${COPY_REGULAR_MENUS ? `, ${copiedRegularMenusCount} regular menus from last ${DAYS_REGULAR_MENU} days, ${copiedMenuMealFoodsCount} menu-meal-food connections, ${copiedConsumerFoodsCount} consumer-food connections, ${copiedConsumerFoodExclusionsCount} consumer-food-exclusion connections` : ' (regular menus skipped)'}${COPY_ORDERS ? `, ${copiedOrdersCount} orders from last ${DAYS_ORDER} days, ${copiedOrderBreakfastCount} breakfast orders, ${copiedOrderLunchCount} lunch orders, ${copiedOrderDinnerCount} dinner orders, ${copiedOrderLunchBDCount} lunch BD orders, ${copiedOrderDinnerBDCount} dinner BD orders` : ' (orders skipped)'} from ${cateringIdToCopyOrigin} to ${cateringIdToCopyDestination}`,
            copiedClientsCount,
            copiedConsumersCount,
            copiedAllergensCount,
            copiedConsumerAllergensCount,
            copiedExclusionsCount,
            copiedExclusionAllergensCount,
            copiedFoodCategoriesCount,
            copiedFoodCount,
            copiedFoodAllergensCount,
            copiedMealsCount,
            copiedDeliveryRoutesCount,
            updatedClientsWithRoutesCount,
            daysOrderFilter: DAYS_ORDER,
            copyOrdersEnabled: COPY_ORDERS,
            daysRegularMenuFilter: DAYS_REGULAR_MENU,
            copyRegularMenusEnabled: COPY_REGULAR_MENUS,
            copiedRegularMenusCount,
            copiedMenuMealFoodsCount,
            copiedConsumerFoodsCount,
            copiedConsumerFoodExclusionsCount,
            ...(COPY_ORDERS && {
                copiedOrdersCount,
                copiedOrderBreakfastCount,
                copiedOrderLunchCount,
                copiedOrderDinnerCount,
                copiedOrderLunchBDCount,
                copiedOrderDinnerBDCount,
            }),
            managerEmail,
            mappings: {
                clients: Object.keys(clientIdMapping).length,
                users: Object.keys(userIdMapping).length,
                consumers: Object.keys(consumerIdMapping).length,
                allergens: Object.keys(allergenIdMapping).length,
                exclusions: Object.keys(exclusionIdMapping).length,
                foodCategories: Object.keys(foodCategoryIdMapping).length,
                food: Object.keys(foodIdMapping).length,
                meals: Object.keys(mealIdMapping).length,
                deliveryRoutes: Object.keys(deliveryRouteIdMapping).length,
                regularMenus: Object.keys(regularMenuIdMapping).length,
                consumerFoods: Object.keys(consumerFoodIdMapping).length,
                ...(COPY_ORDERS && {
                    orders: Object.keys(orderIdMapping).length,
                }),
            }
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log('Error copying clients:', errorMessage);

        return {
            success: false,
            error: errorMessage,
            originCateringId: cateringIdToCopyOrigin,
            destinationCateringId: cateringIdToCopyDestination
        };
    }


}

export default copyCateringDataToOther;