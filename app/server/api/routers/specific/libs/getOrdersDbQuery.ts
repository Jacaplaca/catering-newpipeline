import { type Prisma, type RoleType, type OrderStatus } from '@prisma/client';

const getOrderDbQuery = ({
    searchValue,
    showColumns,
    catering,
    id,
    clientId,
    withNameOnly,
    roleId,
    status,
    tagId
}: {
    count?: boolean,
    searchValue?: string,
    catering: { id: string },
    showColumns?: string[],
    id?: string,
    clientId?: string,
    withNameOnly?: boolean,
    roleId?: RoleType,
    status?: OrderStatus | null,
    tagId?: string,
}) => {
    const orConditions = showColumns?.map(column => ({
        [column]: { $regex: searchValue, $options: 'i' },
    })) ?? [];

    type MatchObject = {
        id?: string;
        $or?: Record<string, {
            $regex?: string;
            $options?: string;
        }>[];
    };

    const query: MatchObject = {}

    if (id) {
        query.id = id;
    }

    if (searchValue && showColumns?.length) {
        query.$or = orConditions
    }

    const pipeline = [
        {
            $match: {
                cateringId: catering.id
            }
        },
    ] as Prisma.InputJsonValue[]

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

    if (status) {
        pipeline.push({
            $match: {
                status: status
            }
        })
    }

    if (roleId === 'manager' || roleId === 'kitchen') {
        pipeline.push({
            $match: {
                status: { $ne: 'draft' }
            }
        })
    }

    const startWith = (el: string) => showColumns ? showColumns.some(item => item.startsWith(el)) : true;

    if (startWith('client.')) {
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

    const fieldsToAdd = {
        $addFields: {
            id: "$_id",
        } as Record<string, unknown>
    };

    if (startWith('client.')) {
        fieldsToAdd.$addFields.client = {
            id: '$client._id',
            name: '$client.info.name',
            code: '$client.info.code',
        }
    }

    if (tagId) {
        pipeline.push({
            $lookup: {
                from: 'TagClient',
                localField: 'clientId',
                foreignField: 'clientId',
                as: 'tagClients'
            }
        });
        pipeline.push({
            $match: {
                'tagClients.tagId': tagId
            }
        });
    }

    pipeline.push(fieldsToAdd as Prisma.InputJsonValue);

    const projection = {
        _id: 0,
        id: 1,
        deliveryDay: 1,
        status: 1,
        client: {
            id: 1,
            name: 1,
            code: 1,
        },
        breakfastStandard: 1,
        lunchStandard: 1,
        lunchStandardBeforeDeadline: 1,
        dinnerStandard: 1,
        dinnerStandardBeforeDeadline: 1,
        breakfastDiet: 1,
        breakfastDietCount: 1,
        lunchDiet: 1,
        lunchDietCount: 1,
        lunchDietCountBeforeDeadline: 1,
        dinnerDiet: 1,
        dinnerDietCount: 1,
        dinnerDietCountBeforeDeadline: 1,
        updatedAt: 1,
        sentToCateringAt: 1,
        isLunchStandardChanged: {
            $ne: ['$lunchStandard', '$lunchStandardBeforeDeadline']
        },
        isDinnerStandardChanged: {
            $ne: ['$dinnerStandard', '$dinnerStandardBeforeDeadline']
        },
        isLunchDietCountChanged: {
            $ne: ['$lunchDietCount', '$lunchDietCountBeforeDeadline']
        },
        isDinnerDietCountChanged: {
            $ne: ['$dinnerDietCount', '$dinnerDietCountBeforeDeadline']
        },
        isChanged: {
            $or: [
                { $ne: ['$lunchStandard', '$lunchStandardBeforeDeadline'] },
                { $ne: ['$dinnerStandard', '$dinnerStandardBeforeDeadline'] },
                { $ne: ['$lunchDietCount', '$lunchDietCountBeforeDeadline'] },
                { $ne: ['$dinnerDietCount', '$dinnerDietCountBeforeDeadline'] },
            ]
        },
    } as Record<string, unknown>;

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

export default getOrderDbQuery;