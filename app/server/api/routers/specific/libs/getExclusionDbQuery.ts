import { type Prisma, type Catering } from '@prisma/client';

const getExclusionDbQuery = ({
    searchValue,
    showColumns,
    catering,
    id,
    allergens,
    withAllergens,
}: {
    searchValue?: string,
    showColumns?: string[],
    catering: Catering,
    id?: string,
    allergens?: string[],
    withAllergens?: string[],
}) => {
    const orConditions = showColumns?.map(column => ({
        [column]: { $regex: searchValue, $options: 'i' },
    })) ?? [];

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

    const startWith = (el: string) => showColumns ? showColumns.some(item => item.startsWith(el)) : true;

    const addAllergens = startWith('allergens') ?? id ?? withAllergens;

    // Lookup for allergens
    if (addAllergens) {
        pipeline.push({
            $lookup: {
                from: 'ExclusionAllergen',
                localField: '_id',
                foreignField: 'exclusionId',
                as: 'exclusionAllergens'
            }
        });
        pipeline.push({
            $lookup: {
                from: 'Allergen',
                localField: 'exclusionAllergens.allergenId',
                foreignField: '_id',
                as: 'allergenDetails'
            }
        });
    }

    const fieldsToAdd = { $addFields: { id: "$_id" } as Record<string, unknown> };

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

    // Add filtering by allergens
    if (allergens && allergens.length > 0) {
        pipeline.push({
            $match: {
                'allergenDetails._id': { $all: allergens }
            }
        });
    }

    // Add search filtering after lookups are done
    if (searchValue) {
        pipeline.push({
            $match: {
                $or: [
                    { name: { $regex: searchValue, $options: 'i' } },
                    { 'allergens.name': { $regex: searchValue, $options: 'i' } }
                ]
            }
        });
    }

    const projection = {
        _id: 0,
        id: 1,
        name: 1,
        cateringId: 1,
        createdAt: 1,
        updatedAt: 1,
    } as Record<string, unknown>;

    if (id) {
        projection.allergens = 1;
    }

    if (addAllergens) {
        projection.allergens = 1;
    }

    const pipelineOrg = [
        {
            $project: projection
        }
    ] as Prisma.InputJsonValue[];

    // Remove the old search logic from here
    if (id) {
        pipelineOrg.push({
            $match: { id: id }
        });
    }

    if (withAllergens && withAllergens.length > 0) {
        pipelineOrg.push({
            $match: {
                allergens: {
                    $elemMatch: {
                        id: { $in: withAllergens }
                    }
                }
            }
        });
    }

    pipeline.push(...pipelineOrg);

    return pipeline;

}

export default getExclusionDbQuery;