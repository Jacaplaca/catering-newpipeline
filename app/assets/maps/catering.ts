import { OrderStatus, type RoleType, ClientFileType } from '@prisma/client';
import { MealType, type TableType } from '@root/types/specific';

export const settingColumnsRole = {
    'consumers_columns': {
        dietician: "consumer-for-dietician",
        client: "consumer-for-client",
        manager: "consumer-for-manager",
        superAdmin: null,
        kitchen: null,
    },
    'clients_columns': {
        dietician: null,
        client: null,
        manager: null,
        superAdmin: null,
        kitchen: null,
    },
    'orders_columns': {
        dietician: null,
        client: 'order-for-client',
        manager: 'order-for-manager',
        superAdmin: null,
        kitchen: 'order-for-kitchen',
    },
} as Record<TableType, Record<RoleType, string | null>>;

export const orderStatusDictionary = {
    [OrderStatus.draft]: 'orders:status_draft',
    [OrderStatus.in_progress]: 'orders:status_in_progress',
    [OrderStatus.completed]: 'orders:status_completed',
} as Record<OrderStatus, string>;

export const clientFileTypeDictionary = {
    [ClientFileType.menu]: { type: 'client-files:file_type_menu', tooltip: 'client-files:file_type_menu_tooltip' },
    [ClientFileType.checklist]: { type: 'client-files:file_type_checklist', tooltip: 'client-files:file_type_checklist_tooltip' },
    [ClientFileType.diets]: { type: 'client-files:file_type_diets', tooltip: 'client-files:file_type_diets_tooltip' },
} as Record<ClientFileType, { type: string, tooltip: string }>;

export const mealGroup2orderField = {
    breakfast: { standard: 'breakfastStandard', diet: 'breakfastDietCount', dietCollection: 'OrderConsumerBreakfast' },
    lunch: { standard: 'lunchStandard', diet: 'lunchDietCount', dietCollection: 'OrderConsumerLunch' },
    dinner: { standard: 'dinnerStandard', diet: 'dinnerDietCount', dietCollection: 'OrderConsumerDinner' },
    // breakfastStandard: 'breakfast',
    // breakfastDiet: 'breakfast',
    // lunchStandard: 'lunch',
    // lunchDiet: 'lunch',
    // dinnerStandard: 'dinner',
    // dinnerDiet: 'dinner',
} as Record<MealType, { standard: string, diet: string, dietCollection: string }>
