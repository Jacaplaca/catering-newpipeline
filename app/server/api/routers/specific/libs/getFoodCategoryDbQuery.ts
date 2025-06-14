import { type Prisma, type Catering } from '@prisma/client';

const getFoodCategoryDbQuery = ({
    // searchValue,
    // showColumns,
    catering,
    id,
}: {
    // searchValue?: string,
    catering: Catering,
    // showColumns?: string[],
    id?: string,
    // role?: RoleType | 'all'
}) => {
    // const orConditions = showColumns?.map(column => ({
    //     [column]: { $regex: searchValue, $options: 'i' },
    // })) ?? [];

    type MatchObject = {
        cateringId?: string;
        id?: string;
        $or?: Record<string, {
            $regex?: string;
            $options?: string;
        }>[];
    };

    const query: MatchObject = {
        cateringId: catering.id,
    }

    if (id) {
        query.id = id;
    }

    // if (searchValue && showColumns?.length) {
    //     query.$or = orConditions
    // }

    const pipeline = [
        {
            $addFields: {
                id: '$_id'
            }
        },
        // {
        //     $addFields: {
        //         "settings.lastOrderTime": { $ifNull: ['$settings.lastOrderTime', catering.settings.lastOrderTime] }  // Jeśli ownName jest null, ustaw 'Default Name'
        //     }
        // },
        // {
        //     $project: {
        //         _id: 0,
        //         id: 1,
        //         cateringId: 1,
        //         info: 1,
        //         settings: 1,
        //         name: 1,
        //         code: 1,
        //         createdAt: 1,
        //         tags: 1,
        //         deactivated: 1,
        //         email: 1
        //     }
        // },
        {
            $match: query
        },
    ] as Prisma.InputJsonValue[]

    return pipeline;

}

export default getFoodCategoryDbQuery;