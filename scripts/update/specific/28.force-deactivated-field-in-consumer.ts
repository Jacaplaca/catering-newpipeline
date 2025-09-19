import { db } from '@root/app/server/db';

const forceDeactivatedFieldInConsumer = async () => {
    console.log('28 >>> forceDeactivatedFieldInConsumer...');

    const emptyDeactivated = await db.consumer.aggregateRaw({
        pipeline: [
            { $match: { deactivated: { $ne: true } } }
        ]
    }) as unknown as { _id: string }[];

    await db.consumer.updateMany({
        where: {
            id: { in: emptyDeactivated.map((consumer) => consumer._id) }
        },
        data: {
            deactivated: false,
        },
    });

    console.log(`28 <<< forceDeactivatedFieldInConsumer finished. ${emptyDeactivated.length} consumers updated.`);

};

export default forceDeactivatedFieldInConsumer;