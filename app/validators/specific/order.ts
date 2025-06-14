import { OrderStatus } from '@prisma/client';
import { env } from '@root/app/env';
import { i18n } from '@root/i18n-config';
import { ordersSortNames, MealType, ordersGroupedByMonthSortNames, ordersGroupedByClientAndMonthSortNames } from '@root/types/specific';
import { z } from 'zod';

export const orderValidator = z.object({
    clientId: z.string(),
    standards: z.object({
        breakfast: z.number().min(0),
        lunch: z.number().min(0),
        dinner: z.number().min(0),
    }),
    diet: z.object({
        breakfast: z.array(z.string()),
        lunch: z.array(z.string()),
        dinner: z.array(z.string()),
    }),
    day: z.object({
        year: z.number().min(0),
        month: z.number().min(0).max(12),
        day: z.number().min(0).max(31),
    }),
    notes: z.string().optional(),
});

export const orderForEditValid = orderValidator.extend({
    id: z.string(),
});

export const getOrdersValid = z.object({
    tagId: z.string().optional(),
    status: z.nativeEnum(OrderStatus).nullable().optional().default(null),
    limit: z.number().int().min(1).default(10),
    page: z.number().int().min(1).default(1),
    sortName: z.enum(ordersSortNames).optional(),
    sortDirection: z.enum(['asc', 'desc']).optional(),
    searchValue: z.string().optional(),
    showColumns: z.array(z.string()).optional(),
    clientId: z.string().optional(),
});

export const orderForTableValid = z.object({
    id: z.string(),
})

export const getOrdersCountValid = z.object({
    status: z.nativeEnum(OrderStatus).nullable().optional().default(null),
    tagId: z.string().optional(),
    searchValue: z.string().optional(),
    showColumns: z.array(z.string()).optional(),
    clientId: z.string().optional(),
});

export const getOrdersGroupedByDayValid = z.object({
    limit: z.number().int().min(1).default(10),
    page: z.number().int().min(1).default(1),
    sortDirection: z.enum(['asc', 'desc']).optional(),
});

export const getDayValid = z.object({
    dayId: z.string(),
});

export const getMealOrdersValid = z.object({
    dayId: z.string(),
    meal: z.nativeEnum(MealType),
});

export const getOrderValid = z.object({
    id: z.string(),
});

export const deleteManyValid = z.object({
    ids: z.array(z.string()),
});

export const completeValid = z.object({
    ids: z.array(z.string()),
});

export const getOrdersPdfValid = z.object({
    dayId: z.string(),
    mealType: z.nativeEnum(MealType),
    lang: z.enum(i18n.locales).default(env.NEXT_PUBLIC_DEFAULT_LOCALE),
});

export const getRoutesPdfValid = z.object({
    dayId: z.string(),
    lang: z.enum(i18n.locales).default(env.NEXT_PUBLIC_DEFAULT_LOCALE),
});

export const getLastOrderValid = z.object({
    clientId: z.string(),
});

export const orderedDatesValid = z.object({
    clientId: z.string(),
});

export const monthDataForClientValid = z.object({
    clientId: z.string().optional(),
    limit: z.number().int().min(1).default(10),
    page: z.number().int().min(1).default(1),
    sortName: z.enum(ordersGroupedByMonthSortNames).optional(),
    sortDirection: z.enum(['asc', 'desc']).optional(),
});

export const monthCountForClientValid = z.object({
    clientId: z.string().optional(),
});

export const monthForClientValid = z.object({
    deliveryMonth: z.string(),
    clientId: z.string().optional(),
});

export const monthAllClientsValid = z.object({
    deliveryMonth: z.string(),
    limit: z.number().int().min(1).default(10),
    page: z.number().int().min(1).default(1),
    sortName: z.enum(ordersGroupedByClientAndMonthSortNames),
    sortDirection: z.enum(['asc', 'desc']).optional(),
});


