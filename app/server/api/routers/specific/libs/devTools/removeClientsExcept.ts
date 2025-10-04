import { db } from "@root/app/server/db";

const removeClientsExcept = async (cateringId: string, clientIdsToProtect: string[]) => {
    console.log("=== Starting client removal process ===");
    console.log(`Catering ID: ${cateringId}`);
    console.log(`Protected client IDs: ${clientIdsToProtect.join(", ")}`);

    // 1. Find all clients to remove (all in catering except protected ones)
    const clientsToRemove = await db.client.findMany({
        where: {
            cateringId,
            id: {
                notIn: clientIdsToProtect,
            },
        },
        select: {
            id: true,
            name: true,
        },
    });

    console.log(`\nFound ${clientsToRemove.length} clients to remove:`);
    clientsToRemove.forEach((client) => {
        console.log(`  - ${client.name ?? "Unnamed"} (${client.id})`);
    });

    if (clientsToRemove.length === 0) {
        console.log("\nNo clients to remove. Exiting.");
        return;
    }

    const clientIdsToRemove = clientsToRemove.map((c) => c.id);

    // 2. Find all consumers of these clients
    const consumers = await db.consumer.findMany({
        where: {
            clientId: {
                in: clientIdsToRemove,
            },
        },
        select: {
            id: true,
        },
    });

    const consumerIdsToRemove = consumers.map((c) => c.id);
    console.log(`\nFound ${consumerIdsToRemove.length} consumers to remove`);

    // 3. Delete ConsumerFood for these consumers
    // (ConsumerFoodExclusion will be deleted by cascade)
    const deletedConsumerFoods = await db.consumerFood.deleteMany({
        where: {
            consumerId: {
                in: consumerIdsToRemove,
            },
        },
    });
    console.log(`Deleted ${deletedConsumerFoods.count} ConsumerFood records`);

    // 4. Delete RegularMenu for these clients
    // (MenuMealFood will be deleted by cascade)
    const deletedRegularMenus = await db.regularMenu.deleteMany({
        where: {
            clientId: {
                in: clientIdsToRemove,
            },
        },
    });
    console.log(`Deleted ${deletedRegularMenus.count} RegularMenu records`);

    // 5. Count related data before deletion (for reporting)
    const consumerAllergenCount = await db.consumerAllergen.count({
        where: {
            consumerId: {
                in: consumerIdsToRemove,
            },
        },
    });

    const orderCount = await db.order.count({
        where: {
            clientId: {
                in: clientIdsToRemove,
            },
        },
    });

    const clientFileCount = await db.clientFile.count({
        where: {
            clientId: {
                in: clientIdsToRemove,
            },
        },
    });

    console.log(`\nRelated data to be deleted by cascade:`);
    console.log(`  - ${consumers.length} Consumer records`);
    console.log(`  - ${consumerAllergenCount} ConsumerAllergen records`);
    console.log(`  - ${orderCount} Order records`);
    console.log(`  - ${clientFileCount} ClientFile records`);

    // 6. Delete clients (this will cascade delete:
    //    - Consumer (and ConsumerAllergen by cascade)
    //    - Order (and all OrderConsumer* relations by cascade)
    //    - ClientFile)
    const deletedClients = await db.client.deleteMany({
        where: {
            id: {
                in: clientIdsToRemove,
            },
        },
    });

    console.log(`\nDeleted ${deletedClients.count} Client records`);
    console.log("\n=== Client removal process completed ===");
}

export default removeClientsExcept;