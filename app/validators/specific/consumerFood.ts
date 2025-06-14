import { z } from "zod";

export const consumerFoodValidator = z.object({
    id: z.string(),
    food: z.object({
        id: z.string(),
        name: z.string(),
        ingredients: z.string().nullable(),
        allergens: z.array(z.object({
            id: z.string(),
            name: z.string(),
        })),
    }),
    exclusions: z.array(z.object({
        id: z.string(),
        name: z.string(),
        allergens: z.array(z.object({
            id: z.string(),
            name: z.string(),
        })),
    })),
    comment: z.string(),
});

export const consumerFoodGetOneValidator = z.object({
    id: z.string(),
});

export const autoReplaceValidator = z.object({
    id: z.string(),
});

export const resetOneValidator = z.object({
    id: z.string(),
});

export const consumerFoodGetByClientIdValidator = z.object({
    clientId: z.string(),
    day: z.object({
        year: z.number(),
        month: z.number(),
        day: z.number(),
    }),
});