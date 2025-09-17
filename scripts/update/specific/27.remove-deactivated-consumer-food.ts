import { db } from '@root/app/server/db';



const removeDeactivatedConsumerFood = async () => {
    console.log('27 >>> removeDeactivatedConsumerFood...');

    const deactivatedConsumers = await db.consumer.findMany({
        where: {
            deactivated: true,
        },
        select: {
            id: true,
        },
    });

    if (deactivatedConsumers.length === 0) {
        console.log('No deactivated consumers found. Nothing to do.');
        return;
    }

    const deactivatedConsumerIds = deactivatedConsumers.map(
        (consumer) => consumer.id,
    );

    console.log(
        `Found ${deactivatedConsumerIds.length} deactivated consumers. Removing their consumerFood records...`,
    );

    const { count } = await db.consumerFood.deleteMany({
        where: {
            consumerId: {
                in: deactivatedConsumerIds,
            },
        },
    });

    console.log(`Successfully removed ${count} consumerFood records.`);
    console.log('27 <<< removeDeactivatedConsumerFood finished.');
};

export default removeDeactivatedConsumerFood;