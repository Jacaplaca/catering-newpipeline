import { clientSortNames } from '@root/types/specific';
import { z } from 'zod';

export const getClients = z.object({
    limit: z.number().int().min(1).default(10),
    page: z.number().int().min(1).default(1),
    sortName: z.enum(clientSortNames).optional(),
    sortDirection: z.enum(['asc', 'desc']).optional(),
    searchValue: z.string().optional(),
    showColumns: z.array(z.string()).optional(),
    tagId: z.string().optional(),
});

export const getClientListValid = z.object({
    name: z.string().optional(),
    cursor: z.number().optional(),
    limit: z.number().min(1).max(100).default(50)
});

export const getClientsCount = z.object({
    searchValue: z.string().optional(),
    showColumns: z.array(z.string()).optional(),
    tagId: z.string().optional(),
});

export const clientEditValidator = z.object({
    id: z.string(),
    name: z.string().optional(),
    code: z.string().optional(),
    email: z.string().optional().refine((value) => value === '' || z.string().email().safeParse(value).success, {
        message: 'shared:email_invalid',
    }), // or email: z.union([z.string().email('shared:email_invalid'), z.literal('')]).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
    contactPerson: z.string().optional(),
    notes: z.string().optional(),
    // tags: z.array(z.string()),
    deliveryRoute: z.object({
        id: z.string(),
        name: z.string(),
    }).nullable(),
    firstOrderDeadline: z.string().optional(),
    secondOrderDeadline: z.string().optional(),
    allowWeekendOrder: z.boolean().optional(),
});

export const getClientValidator = z.object({
    id: z.string(),
});

export const activateClientValidator = z.object({
    ids: z.array(z.string()),
});

export const removeClientValidator = z.object({
    ids: z.array(z.string()),
});