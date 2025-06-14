import { exclusionSortNames } from '@root/types/specific';
import { z } from 'zod';

export const getExclusionsValidator = z.object({
    limit: z.number().int().min(1).default(10),
    page: z.number().int().min(1).default(1),
    sortName: z.enum(exclusionSortNames).optional(),
    sortDirection: z.enum(['asc', 'desc']).optional(),
    allergens: z.array(z.string()).optional(),
    searchValue: z.string().optional(),
});

export const getExclusionsCountValidator = z.object({
    allergens: z.array(z.string()).optional(),
    searchValue: z.string().optional(),
});

// export const getRoutesCount = z.object({
//     searchValue: z.string().optional(),
// });

export const exclusionCreateValidator = z.object({
    name: z.string(),
    allergens: z.array(z.object({
        id: z.string(),
        name: z.string(),
    })).optional(),
});

export const exclusionEditValidator = z.object({
    id: z.string(),
    name: z.string(),
    allergens: z.array(z.object({
        id: z.string(),
        name: z.string(),
    })).optional(),
});

export const removeExclusionValidator = z.object({
    ids: z.array(z.string()),
});

export const exclusionGetOneValidator = z.object({
    id: z.string(),
});

export const exclusionListValidator = z.object({
    searchValue: z.string().optional(),
    cursor: z.number().optional(),
    limit: z.number().min(1).max(100).default(50),
    withAllergens: z.array(z.string()).optional(),
});
