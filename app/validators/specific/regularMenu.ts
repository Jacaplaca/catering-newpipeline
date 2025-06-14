import { z } from 'zod';

export const regularMenuCreateValidator = z.object({
    day: z.object({
        year: z.number(),
        month: z.number(),
        day: z.number(),
    }),
    foods: z.array(z.object({
        id: z.string(),
        name: z.string().optional(),
        mealId: z.string(),
    }))
});

export const regularMenuEditValidator = z.object({
    id: z.string(),
    day: z.object({
        year: z.number(),
        month: z.number(),
        day: z.number(),
    }),
    foods: z.array(z.object({
        id: z.string(),
        name: z.string().optional(),
        mealId: z.string(),
    }))
});

export const regularMenuRemoveValidator = z.object({
    ids: z.array(z.string()),
});

export const regularMenuGetOneValidator = z.object({
    day: z.object({
        year: z.number(),
        month: z.number(),
        day: z.number(),
    }).optional(),
});

export const regularMenuListValidator = z.object({
    searchValue: z.string().optional(),
    cursor: z.number().optional(),
    limit: z.number().min(1).max(100).default(50)
});