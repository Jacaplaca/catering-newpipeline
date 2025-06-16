import { foodSortNames } from '@root/types/specific';
import { z } from 'zod';

export const getFoodsValidator = z.object({
    limit: z.number().int().min(1).default(10),
    page: z.number().int().min(1).default(1),
    sortName: z.enum(foodSortNames).optional(),
    sortDirection: z.enum(['asc', 'desc']).optional(),
    foodCategory: z.string().optional(),
    allergens: z.array(z.string()).optional(),
    searchValue: z.string().optional(),
});

export const getFoodsCountValidator = z.object({
    foodCategory: z.string().optional(),
    allergens: z.array(z.string()).optional(),
    searchValue: z.string().optional(),
});

// export const getRoutesCount = z.object({
//     searchValue: z.string().optional(),
// });

export const foodCreateValidator = z.object({
    name: z.string({ required_error: "food:name_required" }).min(1, "food:name_required"),
    ingredients: z.string().optional(),
    foodCategory: z.object({
        id: z.string(),
        name: z.string(),
    }, { required_error: "food:food_category_required" }),
    allergens: z.array(z.object({
        id: z.string(),
        name: z.string(),
    })).optional(),
});

export const foodEditValidator = z.object({
    id: z.string(),
    name: z.string({ required_error: "food:name_required" }).min(1, "food:name_required"),
    ingredients: z.string().optional(),
    foodCategory: z.object({
        id: z.string(),
        name: z.string(),
    }, { required_error: "food:food_category_required" }),
    allergens: z.array(z.object({
        id: z.string(),
        name: z.string(),
    })).optional(),
});

export const removeFoodValidator = z.object({
    ids: z.array(z.string()),
});

export const foodGetOneValidator = z.object({
    id: z.string(),
});

export const foodListValidator = z.object({
    searchValue: z.string().optional(),
    cursor: z.number().optional(),
    limit: z.number().min(1).max(100).default(50),
    excludeAllergens: z.array(z.string()).optional(),
});

export const foodFormValidator = z.object({
    id: z.string(),
    name: z.string({ required_error: "Name is required" }).min(1, "Name cannot be empty"),
    ingredients: z.string().optional(),
    foodCategory: z.object({
        id: z.string(),
        name: z.string(),
    }).optional(),
    allergens: z.array(z.object({
        id: z.string(),
        name: z.string(),
    })).optional(),
});
