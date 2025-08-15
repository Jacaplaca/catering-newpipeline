import { mealSortNames } from "@root/types/specific";
import { z } from "zod";

export const getMealsValidator = z.object({
    limit: z.number().int().min(1).default(10),
    page: z.number().int().min(1).default(1),
    sortName: z.enum(mealSortNames).optional(),
    sortDirection: z.enum(['asc', 'desc']).optional(),
    // searchValue: z.string().optional(),
});

// export const getRoutesCount = z.object({
//     searchValue: z.string().optional(),
// });

const mealBaseValidator = z.object({
    name: z.string(),
    mealCategory: z
        .object({
            id: z.string().optional(),
            name: z.string(),
        })
        .optional(),
    mealGroup: z
        .object({
            id: z.string().optional(),
            name: z.string(),
        })
        .optional(),
    separateLabel: z.boolean().optional(),
});

export const mealCreateValidator = mealBaseValidator;

export const mealEditValidator = mealBaseValidator.extend({
    id: z.string(),
    mealCategory: mealBaseValidator.shape.mealCategory.unwrap().extend({
        id: z.string(),
    }).optional(),
    mealGroup: mealBaseValidator.shape.mealGroup.unwrap().extend({
        id: z.string(),
    }).optional(),
});

export const removeMealValidator = z.object({
    ids: z.array(z.string()),
});

export const mealGetOneValidator = z.object({
    id: z.string(),
});

export const getMealListValidator = z.object({
    searchValue: z.string().optional(),
    cursor: z.number().optional(),
    limit: z.number().min(1).max(100).default(50)
});
