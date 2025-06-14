import { allergenSortNames } from '@root/types/specific';
import { z } from 'zod';

export const getAllergensValidator = z.object({
    limit: z.number().int().min(1).default(10),
    page: z.number().int().min(1).default(1),
    sortName: z.enum(allergenSortNames).optional(),
    sortDirection: z.enum(['asc', 'desc']).optional(),
    // searchValue: z.string().optional(),
});

// export const getRoutesCount = z.object({
//     searchValue: z.string().optional(),
// });

export const allergenCreateValidator = z.object({
    name: z.string(),
});

export const allergenEditValidator = z.object({
    id: z.string(),
    name: z.string(),
});

export const removeAllergenValidator = z.object({
    ids: z.array(z.string()),
});

export const allergenGetOneValidator = z.object({
    id: z.string(),
});

export const getAllergenListValidator = z.object({
    searchValue: z.string().optional(),
    cursor: z.number().optional(),
    limit: z.number().min(1).max(100).default(50)
});
