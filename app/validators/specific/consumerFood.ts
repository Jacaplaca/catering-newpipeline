import { env } from '@root/app/env';
import { i18n } from '@root/i18n-config';
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
    alternativeFood: z.object({
        id: z.string(),
        name: z.string(),
        ingredients: z.string().nullable(),
        allergens: z.array(z.object({
            id: z.string(),
            name: z.string(),
        })),
    }).optional(),
    exclusions: z.array(z.object({
        id: z.string(),
        name: z.string(),
        allergens: z.array(z.object({
            id: z.string(),
            name: z.string(),
        })),
    })),
    comment: z.string(),
    ignoredAllergens: z.array(z.string()).optional(),
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

export const getSimilarCommentsValidator = z.object({
    consumerFoodId: z.string(),
    query: z.string(),
});

export const getDayMenuPdfValid = z.object({
    dayId: z.string(),
    clientId: z.string().optional(),
    mealId: z.string().optional(),
    lang: z.enum(i18n.locales).default(env.NEXT_PUBLIC_DEFAULT_LOCALE),
    week: z.boolean().optional().default(false),
});