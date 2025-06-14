import { consumersSortNames } from '@root/types/specific';
import { z } from 'zod';

export const getConsumersValid = z.object({
    limit: z.number().int().min(1).default(10),
    page: z.number().int().min(1).default(1),
    sortName: z.enum(consumersSortNames).optional(),
    sortDirection: z.enum(['asc', 'desc']).optional(),
    customerSearchValue: z.string().optional(),
    dietSearchValue: z.string().optional(),
    showColumns: z.array(z.string()).optional(),
    clientId: z.string().optional(),
    clientPlaceId: z.string().optional(),
});

export const getConsumersCountValid = z.object({
    customerSearchValue: z.string().optional(),
    dietSearchValue: z.string().optional(),
    showColumns: z.array(z.string()).optional(),
    clientId: z.string().optional(),
    clientPlaceId: z.string().optional(),
});

export const consumerEditValidator = z.object({
    id: z.string().optional(),
    name: z.string().min(1, { message: 'shared:field_required' }),
    code: z.string().min(1, { message: 'shared:field_required' }),
    client: z.object({ name: z.string(), id: z.string().min(2, { message: 'shared:field_required' }), code: z.string() }),
    notes: z.string().optional(),
    diet: z.object({
        code: z.string().optional(),
        description: z.string().optional(),
    }).optional(),
    allergens: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
});

export const getConsumerValid = z.object({
    id: z.string(),
});

export const deleteConsumersValid = z.object({
    ids: z.array(z.string()),
});

export const getConsumerListValid = z.object({
    cursor: z.number().optional(),
    limit: z.number().min(1).max(100).default(50),
    name: z.string().optional(),
});

export const getDietaryAllForClientValid = z.object({
    clientId: z.string(),
});

