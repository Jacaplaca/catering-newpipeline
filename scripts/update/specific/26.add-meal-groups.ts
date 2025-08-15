import { db } from '@root/app/server/db';

// Desired groups to ensure per catering. Names are stored as data in DB.
const mealGroupsToEnsure: Array<{ name: string; order: number; id: string }> = [
    { name: 'Śniadanie', order: 1, id: 'breakfast' },
    { name: 'Obiad', order: 2, id: 'lunch' },
    { name: 'Podwieczorek', order: 3, id: 'dinner' },
];

const addMealGroups = async () => {
    console.log('26 >>> addMealGroups...');

    const caterings = await db.catering.findMany({ select: { id: true, name: true } });
    if (caterings.length === 0) {
        console.log('26 >>> No catering found');
        return;
    }

    let createdCount = 0;
    for (const groupDef of mealGroupsToEnsure) {
        const existing = await db.mealGroup.findFirst({
            where: {
                id: groupDef.id,
            },
            select: { id: true },
        });

        if (existing) {
            // Skip if the group already exists for this catering
            console.log(
                `26 >>> Skip existing group "${groupDef.name}"`
            );
            continue;
        }

        await db.mealGroup.create({
            data: {
                id: groupDef.id,
                name: groupDef.name,
                order: groupDef.order,
            },
        });
        createdCount += 1;
        console.log(
            `26 >>> Created group "${groupDef.name}"`
        );
    }

    console.log(`26 >>> Done. Created ${createdCount} missing meal groups in total.`);
};

export default addMealGroups;