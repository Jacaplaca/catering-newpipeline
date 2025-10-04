import { clientWithCommonAllergensSortNames } from '@root/types/specific';
import { z } from 'zod';

export const regularMenuCreateValidator = z.object({
    clientId: z.string().optional(),
    day: z.object({
        year: z.number(),
        month: z.number(),
        day: z.number(),
    }),
    foods: z.array(z.object({
        id: z.string(),
        order: z.number().optional(),
        name: z.string().optional(),
        mealId: z.string(),
    }))
});

export const regularMenuAddNewClientsValidator = z.object({
    day: z.object({
        year: z.number(),
        month: z.number(), // 0-11
        day: z.number(),
    })
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
        order: z.number().optional(),
        name: z.string().optional(),
        mealId: z.string(),
    }))
});

export const regularMenuRemoveValidator = z.object({
    clientId: z.string(),
    day: z.object({
        year: z.number(),
        month: z.number(),
        day: z.number(),
    }),
});

export const regularMenuGetOneValidator = z.object({
    day: z.object({
        year: z.number(),
        month: z.number(), // 0-11
        day: z.number(),
    }).optional(),
    clientId: z.string().optional(),
});

export const regularMenuListValidator = z.object({
    searchValue: z.string().optional(),
    cursor: z.number().optional(),
    limit: z.number().min(1).max(100).default(50)
});

export const regularMenuConfigureDaysValidator = z.object({
    month: z.number(), // 0-11
    year: z.number(),
});

export const getClientsWithCommonAllergensValidator = z.object({
    day: z.object({
        year: z.number(),
        month: z.number(),
        day: z.number(),
    }),
    limit: z.number().int().min(1).default(10),
    page: z.number().int().min(1).default(1),
    sortName: z.enum(clientWithCommonAllergensSortNames).optional(),
    sortDirection: z.enum(['asc', 'desc']).optional(),
    searchValue: z.string().optional(),
    showColumns: z.array(z.string()).optional(),
    tagId: z.string().optional(),
});

export const closeAndPublishValidator = z.object({
    day: z.object({
        year: z.number(),
        month: z.number(),
        day: z.number(),
    }),
    clientId: z.string().optional(),
});

export const getOneClientWithCommonAllergensValidator = z.object({
    day: z.object({
        year: z.number(),
        month: z.number(),
        day: z.number(),
    }),
    showColumns: z.array(z.string()).optional(),
    clientId: z.string(),
});

export const createAssignmentsValidator = z.object({
    day: z.object({
        year: z.number(),
        month: z.number(),
        day: z.number(),
    }),
    clientId: z.string(),
    consumerId: z.string(),
});

export const updateFoodsOrderInput = z.object({
    items: z.array(z.object({
        id: z.string(),
        order: z.number().int().min(0),
    })).min(1),
})