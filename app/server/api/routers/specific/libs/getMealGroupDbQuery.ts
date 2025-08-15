import { type Prisma } from '@prisma/client';

const getMealGroupDbQuery = ({
    id,
}: {
    id?: string,
}) => {
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

export default getMealGroupDbQuery;