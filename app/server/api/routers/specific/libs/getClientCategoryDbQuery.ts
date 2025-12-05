import { type Prisma, type Catering } from '@prisma/client';

const getClientCategoryDbQuery = ({
    catering,
    id,
}: {
    catering: Catering,
    id?: string,
}) => {
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

    const pipeline = [
        {
            $addFields: {
                id: '$_id'
            }
        },
        {
            $match: query
        },
    ] as Prisma.InputJsonValue[]

    return pipeline;

}

export default getClientCategoryDbQuery;