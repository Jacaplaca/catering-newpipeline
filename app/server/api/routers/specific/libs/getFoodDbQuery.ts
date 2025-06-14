import { type Prisma, type Catering } from '@prisma/client';

const getFoodDbQuery = ({
    searchValue,
    showColumns,
    catering,
    id,
    withFoodCategoryOnly,
    foodCategory,
    allergens,
    excludeAllergens,
}: {
    searchValue?: string,
    showColumns?: string[],
    catering: Catering,
    id?: string,
    withFoodCategoryOnly?: boolean,
    foodCategory?: string,
    allergens?: string[],
    excludeAllergens?: string[],
}) => {
    const orConditions = showColumns?.map(column => ({
        [column]: { $regex: searchValue, $options: 'i' },
    })) ?? [];

    type MatchObject = {
        cateringId?: string;
        id?: string;
        foodCategoryId?: { $exists: boolean; $ne: null };
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

    if (withFoodCategoryOnly) {
        pipeline.push({
            $match: {
                foodCategoryId: { $exists: true, $ne: null }
            }
        });
    }

    const startWith = (el: string) => showColumns ? showColumns.some(item => item.startsWith(el)) : true;

    // Lookup for foodCategory
    if (startWith('foodCategory') || id) {
        pipeline.push({
            $lookup: {
                from: 'FoodCategory',
                localField: 'foodCategoryId',
                foreignField: '_id',
                as: 'foodCategory'
            }
        });
        pipeline.push({
            $unwind: {
                path: '$foodCategory',
                preserveNullAndEmptyArrays: true
            }
        });
    }

    const addAllergens = startWith('allergens') ?? id ?? excludeAllergens;

    // Lookup for allergens
    if (addAllergens) {
        pipeline.push({
            $lookup: {
                from: 'FoodAllergen',
                localField: '_id',
                foreignField: 'foodId',
                as: 'foodAllergens'
            }
        });
        pipeline.push({
            $lookup: {
                from: 'Allergen',
                localField: 'foodAllergens.allergenId',
                foreignField: '_id',
                as: 'allergenDetails'
            }
        });
    }

    const fieldsToAdd = { $addFields: { id: "$_id" } as Record<string, unknown> };

    if (startWith('foodCategory') || id) {
        fieldsToAdd.$addFields.foodCategory = {
            id: '$foodCategory._id',
            name: '$foodCategory.name',
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

    // Add filtering by foodCategory
    if (foodCategory) {
        pipeline.push({
            $match: {
                foodCategoryId: foodCategory
            }
        });
    }

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
                    { ingredients: { $regex: searchValue, $options: 'i' } },
                    { 'foodCategory.name': { $regex: searchValue, $options: 'i' } },
                    { 'allergens.name': { $regex: searchValue, $options: 'i' } }
                ]
            }
        });
    }

    const projection = {
        _id: 0,
        id: 1,
        name: 1,
        ingredients: 1,
        cateringId: 1,
        createdAt: 1,
        updatedAt: 1,
    } as Record<string, unknown>;

    if (id) {
        projection.foodCategory = 1;
        projection.allergens = 1;
    }

    if (startWith('foodCategory')) {
        projection.foodCategory = 1;
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

    if (excludeAllergens && excludeAllergens.length > 0) {
        pipelineOrg.push({
            $match: { 'allergens.id': { $nin: excludeAllergens } }
        });
    }

    pipeline.push(...pipelineOrg);

    return pipeline;

}

export default getFoodDbQuery;