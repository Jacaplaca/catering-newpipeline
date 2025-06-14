import { z } from 'zod';

export const managerSettingsValidator = z.object({
    name: z.string().min(4, "4"),
    phone: z.string(),
    email: z.string().email(),
    // lastOrderTime: z.string()
    //     .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "settings:order_deadline_validation")
    firstOrderDeadline: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "settings:order_deadline_validation"),
    secondOrderDeadline: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "settings:order_deadline_validation"),
    nonWorkingDays: z.array(z.string()),
});

export const clientSettingsValidator = z.object({
    name: z.string().min(4, "4"),
    clientId: z.string().optional(),
    // lastOrderTime: z.string()
    //     .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "settings:order_deadline_validation")
});

export const dieticianSettingsValidator = z.object({
    name: z.string().min(4, "4")
});

export const kitchenSettingsValidator = z.object({
    name: z.string().min(4, "4")
});

export const getClientSettingsValidator = z.object({
    clientId: z.string().optional()
});
