import { db } from '@root/app/server/db';
import log from '@root/app/lib/log';
import { env } from '@root/app/env';

const isLogOn = env.DEV_TOOLS_LOG;
const localLog = (message: string) => log(message, isLogOn);

async function cleanCateringData(cateringId: string) {

    localLog(`Starting cleanup for catering: ${cateringId}`);

    try {
        // 1. Delete order-related data first (most dependent)
        localLog('Deleting order consumer breakfast...');
        const deleteBreakfast = await db.orderConsumerBreakfast.deleteMany({
            where: { order: { cateringId } }
        });
        localLog(`Deleted ${deleteBreakfast.count} order consumer breakfast records`);

        localLog('Deleting order consumer lunch...');
        const deleteLunch = await db.orderConsumerLunch.deleteMany({
            where: { order: { cateringId } }
        });
        localLog(`Deleted ${deleteLunch.count} order consumer lunch records`);

        localLog('Deleting order consumer dinner...');
        const deleteDinner = await db.orderConsumerDinner.deleteMany({
            where: { order: { cateringId } }
        });
        localLog(`Deleted ${deleteDinner.count} order consumer dinner records`);

        localLog('Deleting order consumer lunch before deadline...');
        const deleteLunchBD = await db.orderConsumerLunchBeforeDeadline.deleteMany({
            where: { order: { cateringId } }
        });
        localLog(`Deleted ${deleteLunchBD.count} order consumer lunch before deadline records`);

        localLog('Deleting order consumer dinner before deadline...');
        const deleteDinnerBD = await db.orderConsumerDinnerBeforeDeadline.deleteMany({
            where: { order: { cateringId } }
        });
        localLog(`Deleted ${deleteDinnerBD.count} order consumer dinner before deadline records`);

        // 2. Delete orders
        localLog('Deleting orders...');
        const deleteOrders = await db.order.deleteMany({
            where: { cateringId }
        });
        localLog(`Deleted ${deleteOrders.count} orders`);

        // 3. ConsumerFoodExclusion will be auto-deleted when ConsumerFood is deleted (onDelete: Cascade)

        localLog('Deleting consumer foods...');
        const deleteConsumerFoods = await db.consumerFood.deleteMany({
            where: { cateringId }
        });
        localLog(`Deleted ${deleteConsumerFoods.count} consumer foods`);

        // 4. MenuMealFood will be auto-deleted when RegularMenu is deleted (onDelete: Cascade)

        // 5. Delete regular menus
        localLog('Deleting regular menus...');
        const deleteMenus = await db.regularMenu.deleteMany({
            where: { cateringId }
        });
        localLog(`Deleted ${deleteMenus.count} regular menus`);

        // 6. Consumer allergens will be auto-deleted when consumers are deleted (onDelete: Cascade)

        // 7. Delete consumers
        localLog('Deleting consumers...');
        const deleteConsumers = await db.consumer.deleteMany({
            where: { cateringId }
        });
        localLog(`Deleted ${deleteConsumers.count} consumers`);

        // 8. Delete client files
        localLog('Deleting client files...');
        const deleteFiles = await db.clientFile.deleteMany({
            where: { cateringId }
        });
        localLog(`Deleted ${deleteFiles.count} client files`);

        // 9. Get client user IDs before deleting clients
        localLog('Getting client user IDs...');
        const clientUsers = await db.client.findMany({
            where: { cateringId },
            select: { userId: true }
        });
        const clientUserIds = clientUsers.map(client => client.userId);
        localLog(`Found ${clientUserIds.length} client users to delete later`);

        // 10. Delete clients first (to remove required relation)
        localLog('Deleting clients...');
        const deleteClients = await db.client.deleteMany({
            where: { cateringId }
        });
        localLog(`Deleted ${deleteClients.count} clients`);

        // 11. Now delete client users and their accounts
        if (clientUserIds.length > 0) {
            localLog('Deleting client user sessions...');
            const deleteSessions = await db.session.deleteMany({
                where: { userId: { in: clientUserIds } }
            });
            localLog(`Deleted ${deleteSessions.count} client sessions`);

            localLog('Deleting client user accounts...');
            const deleteAccounts = await db.account.deleteMany({
                where: { userId: { in: clientUserIds } }
            });
            localLog(`Deleted ${deleteAccounts.count} client accounts`);

            localLog('Deleting client user clipboard data...');
            const deleteClipboards = await db.clipboard.deleteMany({
                where: { userId: { in: clientUserIds } }
            });
            localLog(`Deleted ${deleteClipboards.count} client clipboards`);

            localLog('Deleting client change email tokens...');
            const deleteChangeEmailTokens = await db.changeEmailToken.deleteMany({
                where: { userId: { in: clientUserIds } }
            });
            localLog(`Deleted ${deleteChangeEmailTokens.count} client change email tokens`);

            localLog('Deleting client invite tokens...');
            const deleteInviteTokens = await db.inviteToken.deleteMany({
                where: { inviterId: { in: clientUserIds } }
            });
            localLog(`Deleted ${deleteInviteTokens.count} client invite tokens`);

            localLog('Deleting client users...');
            const deleteUsers = await db.user.deleteMany({
                where: { id: { in: clientUserIds } }
            });
            localLog(`Deleted ${deleteUsers.count} client users`);
        }

        // 8. Delete delivery routes
        localLog('Deleting delivery routes...');
        const deleteRoutes = await db.deliveryRoute.deleteMany({
            where: { cateringId }
        });
        localLog(`Deleted ${deleteRoutes.count} delivery routes`);

        // 9. Delete foods (FoodAllergen will be auto-deleted via onDelete: Cascade)
        localLog('Deleting foods...');
        const deleteFoods = await db.food.deleteMany({
            where: { cateringId }
        });
        localLog(`Deleted ${deleteFoods.count} foods`);

        // 10. Delete food categories
        localLog('Deleting food categories...');
        const deleteFoodCats = await db.foodCategory.deleteMany({
            where: { cateringId }
        });
        localLog(`Deleted ${deleteFoodCats.count} food categories`);

        // 11. Delete exclusions (ExclusionAllergen will be auto-deleted via onDelete: Cascade)
        localLog('Deleting exclusions...');
        const deleteExclusions = await db.exclusion.deleteMany({
            where: { cateringId }
        });
        localLog(`Deleted ${deleteExclusions.count} exclusions`);

        // 12. Delete allergens (all allergen junction tables auto-deleted via onDelete: Cascade)
        localLog('Deleting allergens...');
        const deleteAllergens = await db.allergen.deleteMany({
            where: { cateringId }
        });
        localLog(`Deleted ${deleteAllergens.count} allergens`);

        // 13. Delete meals and meal categories
        localLog('Deleting meals...');
        const deleteMeals = await db.meal.deleteMany({
            where: { cateringId }
        });
        localLog(`Deleted ${deleteMeals.count} meals`);

        localLog('Deleting meal categories...');
        const deleteMealCats = await db.mealCategory.deleteMany({
            where: { cateringId }
        });
        localLog(`Deleted ${deleteMealCats.count} meal categories`);

        localLog(`Cleanup completed successfully for catering: ${cateringId}`);

    } catch (error) {
        console.log(`Error during cleanup for catering ${cateringId}:`, error instanceof Error ? error.message : String(error));
        throw error;
    }
}

export default cleanCateringData;