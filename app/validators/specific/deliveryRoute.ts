import { routeSortNames } from '@root/types/specific';
import { z } from 'zod';

export const getRoutesValidator = z.object({
    limit: z.number().int().min(1).default(10),
    page: z.number().int().min(1).default(1),
    sortName: z.enum(routeSortNames).optional(),
    sortDirection: z.enum(['asc', 'desc']).optional(),
    // searchValue: z.string().optional(),
});

// export const getRoutesCount = z.object({
//     searchValue: z.string().optional(),
// });

export const routeCreateValidator = z.object({
    name: z.string(),
    code: z.string(),
    // description: z.string().optional(),
});

export const routeEditValidator = z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
    // description: z.string().optional(),
});

export const removeRouteValidator = z.object({
    ids: z.array(z.string()),
});

export const routeGetOneValidator = z.object({
    id: z.string(),
});

export const getRouteListValid = z.object({
    searchValue: z.string().optional(),
    cursor: z.number().optional(),
    limit: z.number().min(1).max(100).default(50)
});
