import { clientCategorySortNames } from '@root/types/specific';
import { z } from 'zod';

export const getClientCategoriesValidator = z.object({
    limit: z.number().int().min(1).default(10),
    page: z.number().int().min(1).default(1),
    sortName: z.enum(clientCategorySortNames).optional(),
    sortDirection: z.enum(['asc', 'desc']).optional(),
    // searchValue: z.string().optional(),
});

// export const getRoutesCount = z.object({
//     searchValue: z.string().optional(),
// });

export const clientCategoryCreateValidator = z.object({
    name: z.string(),
    code: z.string(),
});

export const clientCategoryEditValidator = z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
});

export const removeClientCategoryValidator = z.object({
    ids: z.array(z.string()),
});

export const clientCategoryGetOneValidator = z.object({
    id: z.string(),
});

export const clientCategoryListValidator = z.object({
    searchValue: z.string().optional(),
    cursor: z.number().optional(),
    limit: z.number().min(1).max(100).default(50)
});

export const clientCategoryGetManyByIdsValidator = z.object({
    ids: z.array(z.string()),
});
