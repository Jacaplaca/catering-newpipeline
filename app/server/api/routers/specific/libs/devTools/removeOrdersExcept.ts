import { db } from "@root/app/server/db";
import dayIdParser from "../dayIdParser";

const removeOrdersExcept = async (cateringId: string, protectedOrderDayIds: string[]) => {
    console.log("=== Starting order removal process ===");
    console.log(`Catering ID: ${cateringId}`);
    console.log(`Protected order day IDs: ${protectedOrderDayIds.join(", ")}`);

    // 1. Parse protected day IDs to DeliveryDay objects
    const protectedDays = protectedOrderDayIds.map((dayId) => {
        try {
            return dayIdParser(dayId);
        } catch (error) {
            console.error(`Error parsing dayId "${dayId}":`, error);
            throw error;
        }
    });

    // 2. Find all orders in catering
    const allOrders = await db.order.findMany({
        where: {
            cateringId,
        },
        select: {
            id: true,
            deliveryDay: true,
            clientId: true,
            status: true,
        },
    });

    console.log(`\nFound ${allOrders.length} total orders in catering`);

    // 3. Filter out protected orders
    const ordersToRemove = allOrders.filter((order) => {
        const isProtected = protectedDays.some(
            (protectedDay) =>
                protectedDay.year === order.deliveryDay.year &&
                protectedDay.month === order.deliveryDay.month &&
                protectedDay.day === order.deliveryDay.day
        );
        return !isProtected;
    });

    console.log(`\nFound ${ordersToRemove.length} orders to remove:`);
    ordersToRemove.forEach((order) => {
        const dateStr = `${order.deliveryDay.year}-${String(order.deliveryDay.month + 1).padStart(2, "0")}-${String(order.deliveryDay.day).padStart(2, "0")}`;
        console.log(`  - ${dateStr} (Client: ${order.clientId}, Status: ${order.status})`);
    });

    if (ordersToRemove.length === 0) {
        console.log("\nNo orders to remove. Exiting.");
        return;
    }

    const orderIdsToRemove = ordersToRemove.map((o) => o.id);

    // 4. Count related data before deletion (for reporting)
    const breakfastCount = await db.orderConsumerBreakfast.count({
        where: {
            orderId: {
                in: orderIdsToRemove,
            },
        },
    });

    const lunchCount = await db.orderConsumerLunch.count({
        where: {
            orderId: {
                in: orderIdsToRemove,
            },
        },
    });

    const dinnerCount = await db.orderConsumerDinner.count({
        where: {
            orderId: {
                in: orderIdsToRemove,
            },
        },
    });

    const lunchBeforeDeadlineCount = await db.orderConsumerLunchBeforeDeadline.count({
        where: {
            orderId: {
                in: orderIdsToRemove,
            },
        },
    });

    const dinnerBeforeDeadlineCount = await db.orderConsumerDinnerBeforeDeadline.count({
        where: {
            orderId: {
                in: orderIdsToRemove,
            },
        },
    });

    console.log(`\nRelated data to be deleted by cascade:`);
    console.log(`  - ${breakfastCount} OrderConsumerBreakfast records`);
    console.log(`  - ${lunchCount} OrderConsumerLunch records`);
    console.log(`  - ${dinnerCount} OrderConsumerDinner records`);
    console.log(`  - ${lunchBeforeDeadlineCount} OrderConsumerLunchBeforeDeadline records`);
    console.log(`  - ${dinnerBeforeDeadlineCount} OrderConsumerDinnerBeforeDeadline records`);

    // 5. Delete orders (this will cascade delete all OrderConsumer* relations)
    const deletedOrders = await db.order.deleteMany({
        where: {
            id: {
                in: orderIdsToRemove,
            },
        },
    });

    console.log(`\nDeleted ${deletedOrders.count} Order records`);
    console.log("\n=== Order removal process completed ===");
};

export default removeOrdersExcept;