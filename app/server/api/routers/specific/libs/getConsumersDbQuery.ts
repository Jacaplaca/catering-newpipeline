import { type Prisma } from '@prisma/client';

const getConsumerDbQuery = ({
    customerSearchValue,
    dietSearchValue,
    showColumns,
    cateringId,
    id,
    clientId,
    withNameOnly,
    withDiet,
    isClient,
    onlyActiveConsumer
}: {
    customerSearchValue?: string,
    dietSearchValue?: string,
    cateringId?: string,
    showColumns?: string[],
    id?: string,
    clientId?: string,
    withNameOnly?: boolean,
    withDiet?: boolean,
    isClient?: boolean,
    onlyActiveConsumer?: boolean
}) => {
    const orConditions = showColumns?.map(column => ({

        [column]: { $regex: customerSearchValue, $options: 'i' },
    })) ?? [];

    type MatchObject = {
        // cateringId?: string;
        "client.deactivated"?: boolean;
        id?: string;
        deactivated?: { $ne: boolean };
        $or?: Record<string, {
            $regex?: string;
            $options?: string;
        }>[];
    };

    const query: MatchObject = {
        // cateringId: catering.id
        "client.deactivated": false
    }

    if (onlyActiveConsumer) {
        query.deactivated = { $ne: true }
    }

    if (id) {
        query.id = id;
    }

    if (customerSearchValue && showColumns?.length) {
        query.$or = orConditions
    }

    const pipeline = [] as Prisma.InputJsonValue[]

    if (cateringId) {
        pipeline.push({
            $match: {
                cateringId
            }
        });
    }

    if (withNameOnly) {
        pipeline.push({
            $match: {
                name: { $exists: true, $ne: "" }
            }
        });
    }

    if (clientId) {
        pipeline.push({
            $match: {
                clientId: clientId
            }
        })
    }

    const startWith = (el: string) => showColumns ? showColumns.some(item => item.startsWith(el)) : true;

    if (startWith('client.') || isClient) {
        pipeline.push({
            $lookup: {
                from: 'Client',
                localField: 'clientId',
                foreignField: '_id',
                as: 'client'
            }
        });
        pipeline.push({
            $unwind: {
                path: '$client',
                preserveNullAndEmptyArrays: true
            }
        });
    }

    if (startWith('dietician')) {
        pipeline.push({
            $lookup: {
                from: 'Dietician',
                localField: 'diet.dieticianId',
                foreignField: '_id',
                as: 'diet.dietician'
            }
        });
        pipeline.push({
            $unwind: {
                path: '$diet.dietician',
                preserveNullAndEmptyArrays: true
            }
        });
    }

    const addAllergens = startWith('allergens') || id ? true : clientId ? true : false;

    if (addAllergens) {
        pipeline.push({
            $lookup: {
                from: 'ConsumerAllergen',
                localField: '_id',
                foreignField: 'consumerId',
                as: 'consumerAllergens'
            }
        });
        pipeline.push({
            $lookup: {
                from: 'Allergen',
                localField: 'consumerAllergens.allergenId',
                foreignField: '_id',
                as: 'allergenDetails'
            }
        });
    }

    if (withDiet) {
        pipeline.push({
            $match: {
                'diet.code': { $exists: true, $ne: null }
            }
        });
    }

    if (dietSearchValue) {
        pipeline.push({
            $match: {
                'diet.code': { $regex: dietSearchValue, $options: 'i' }
            }
        });
    }

    const fieldsToAdd = { $addFields: { id: "$_id" } as Record<string, unknown> };

    if (startWith('client.') || isClient) {
        fieldsToAdd.$addFields.client = {
            id: '$client._id',
            name: '$client.info.name',
            code: '$client.info.code',
            deactivated: '$client.deactivated',
        }
    }

    if (addAllergens) {
        fieldsToAdd.$addFields.allergens = {
            $map: {
                input: '$allergenDetails',
                as: 'allergen',
                in: {
                    id: '$$allergen._id',
                    name: '$$allergen.name'
                }
            }
        };
    }

    pipeline.push(fieldsToAdd as Prisma.InputJsonValue);

    const projection = {
        _id: 0,
        id: 1,
        name: 1,
        code: 1,
        client: {
            id: 1,
            name: 1,
            code: 1,
            deactivated: 1,
        },
        diet: 1,
        notes: 1,
        dietician: 1,
        deactivated: 1,
        createdAt: 1,
    } as Record<string, unknown>;

    if (id) {
        projection.notes = 1;
        projection.allergens = 1;
    }

    if (addAllergens) {
        projection.allergens = 1;
    }

    const pipelineOrg = [
        {
            $project: projection
        },
        {
            $match: query
        },
    ] as Prisma.InputJsonValue[];

    pipeline.push(...pipelineOrg);

    return pipeline;

}

export default getConsumerDbQuery;