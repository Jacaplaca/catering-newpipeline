import { mealCategorySortNames } from '@root/types/specific';
import { z } from 'zod';

export const getMealGroupsValidator = z.object({
    limit: z.number().int().min(1).default(10),
    page: z.number().int().min(1).default(1),
    sortName: z.enum(mealCategorySortNames).optional(),
    sortDirection: z.enum(['asc', 'desc']).optional(),
    // searchValue: z.string().optional(),
});

// export const getRoutesCount = z.object({
//     searchValue: z.string().optional(),
// });

export const mealGroupCreateValidator = z.object({
    name: z.string(),
});

export const mealGroupEditValidator = z.object({
    id: z.string(),
    name: z.string(),
});

export const removeMealGroupValidator = z.object({
    ids: z.array(z.string()),
});

export const mealGroupGetOneValidator = z.object({
    id: z.string(),
});

export const mealGroupListValidator = z.object({
    searchValue: z.string().optional(),
    cursor: z.number().optional(),
    limit: z.number().min(1).max(100).default(50)
});

export const mealGroupGetManyByIdsValidator = z.object({
    ids: z.array(z.string()),
});
