import { foodCategorySortNames } from '@root/types/specific';
import { z } from 'zod';

export const getFoodCategoriesValidator = z.object({
    limit: z.number().int().min(1).default(10),
    page: z.number().int().min(1).default(1),
    sortName: z.enum(foodCategorySortNames).optional(),
    sortDirection: z.enum(['asc', 'desc']).optional(),
    // searchValue: z.string().optional(),
});

// export const getRoutesCount = z.object({
//     searchValue: z.string().optional(),
// });

export const foodCategoryCreateValidator = z.object({
    name: z.string(),
});

export const foodCategoryEditValidator = z.object({
    id: z.string(),
    name: z.string(),
});

export const removeFoodCategoryValidator = z.object({
    ids: z.array(z.string()),
});

export const foodCategoryGetOneValidator = z.object({
    id: z.string(),
});

export const foodCategoryListValidator = z.object({
    searchValue: z.string().optional(),
    cursor: z.number().optional(),
    limit: z.number().min(1).max(100).default(50)
});

export const foodCategoryGetManyByIdsValidator = z.object({
    ids: z.array(z.string()),
});
