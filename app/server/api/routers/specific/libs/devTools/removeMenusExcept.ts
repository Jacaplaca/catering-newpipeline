import { db } from "@root/app/server/db";
import dayIdParser from "../dayIdParser";

const removeMenusExcept = async (cateringId: string, protectedMenuDayIds: string[]) => {
    console.log("=== Starting menu removal process ===");
    console.log(`Catering ID: ${cateringId}`);
    console.log(`Protected menu day IDs: ${protectedMenuDayIds.join(", ")}`);

    // 1. Parse protected day IDs to DeliveryDay objects
    const protectedDays = protectedMenuDayIds.map((dayId) => {
        try {
            return dayIdParser(dayId);
        } catch (error) {
            console.error(`Error parsing dayId "${dayId}":`, error);
            throw error;
        }
    });

    // 2. Find all menus in catering
    const allMenus = await db.regularMenu.findMany({
        where: {
            cateringId,
        },
        select: {
            id: true,
            day: true,
            clientId: true,
        },
    });

    console.log(`\nFound ${allMenus.length} total menus in catering`);

    // 3. Filter out protected menus
    const menusToRemove = allMenus.filter((menu) => {
        const isProtected = protectedDays.some(
            (protectedDay) =>
                protectedDay.year === menu.day.year &&
                protectedDay.month === menu.day.month &&
                protectedDay.day === menu.day.day
        );
        return !isProtected;
    });

    console.log(`\nFound ${menusToRemove.length} menus to remove:`);
    menusToRemove.forEach((menu) => {
        const dateStr = `${menu.day.year}-${String(menu.day.month + 1).padStart(2, "0")}-${String(menu.day.day).padStart(2, "0")}`;
        const clientInfo = menu.clientId ? `Client: ${menu.clientId}` : "Catering menu";
        console.log(`  - ${dateStr} (${clientInfo})`);
    });

    if (menusToRemove.length === 0) {
        console.log("\nNo menus to remove. Exiting.");
        return;
    }

    const menuIdsToRemove = menusToRemove.map((m) => m.id);

    // 4. Count related data before deletion (for reporting)
    const consumerFoodCount = await db.consumerFood.count({
        where: {
            regularMenuId: {
                in: menuIdsToRemove,
            },
        },
    });

    const menuMealFoodCount = await db.menuMealFood.count({
        where: {
            regularMenuId: {
                in: menuIdsToRemove,
            },
        },
    });

    const consumerFoodExclusionCount = await db.consumerFoodExclusion.count({
        where: {
            consumerFood: {
                regularMenuId: {
                    in: menuIdsToRemove,
                },
            },
        },
    });

    console.log(`\nRelated data to be deleted by cascade:`);
    console.log(`  - ${consumerFoodCount} ConsumerFood records`);
    console.log(`  - ${consumerFoodExclusionCount} ConsumerFoodExclusion records`);
    console.log(`  - ${menuMealFoodCount} MenuMealFood records`);

    // 5. Delete menus (this will cascade delete:
    //    - ConsumerFood (and ConsumerFoodExclusion by cascade)
    //    - MenuMealFood)
    const deletedMenus = await db.regularMenu.deleteMany({
        where: {
            id: {
                in: menuIdsToRemove,
            },
        },
    });

    console.log(`\nDeleted ${deletedMenus.count} RegularMenu records`);
    console.log("\n=== Menu removal process completed ===");
};

export default removeMenusExcept;