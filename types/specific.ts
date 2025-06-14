import { type Client, type Diet, type Dietician, type ClientInfo, type OrderStatus, type Consumer, type DeliveryDay, type DeliveryRoute, type Allergen, type FoodCategory, type ConsumerFood, type RegularMenu, type Food, type ConsumerAllergen, type FoodAllergen, type ConsumerFoodExclusion, type Exclusion, type ExclusionAllergen, type Meal } from '@prisma/client';
import { type TableTypeValues } from '@root/app/validators/settings';

export const clientSortNames = ['name', 'email', 'code', "info.name", "info.email", "info.phone",
    "info.address", "info.city", "info.zip", "info.contactPerson", "info.country", "deliveryRoute.code",
    // 'settings.lastOrderTime'
] as const;

export type ClientsSortName = typeof clientSortNames[number];

export const routeSortNames = ['name', 'code'] as const;
export type RouteSortName = typeof routeSortNames[number];

export const allergenSortNames = ['name'] as const;
export type AllergenSortName = typeof allergenSortNames[number];

export const mealSortNames = ['name'] as const;
export type MealSortName = typeof mealSortNames[number];

export const foodCategorySortNames = ['name'] as const;
export type FoodCategorySortName = typeof foodCategorySortNames[number];

export const clientFilesSortNames = ['name', 'code'] as const;

export type ClientFilesSortName = typeof clientFilesSortNames[number];
export const usersSortNames = ['name', 'email'] as const;

export const foodSortNames = ['name', 'foodCategory.name'] as const;
export type FoodSortName = typeof foodSortNames[number];

export const exclusionSortNames = ['name'] as const;
export type ExclusionSortName = typeof exclusionSortNames[number];

export type UsersSortName = typeof usersSortNames[number];

export const dieticianSortNames = ['name'] as const;

export type DieticianSortName = typeof dieticianSortNames[number];

export const kitchensSortNames = ['name'] as const;

export type KitchensSortName = typeof kitchensSortNames[number];

export type ClientCustomTable = {
    id: string;
    userId: string;
    cateringId: string;
    // settings: ClientSettings;
    info: ClientInfo;
    name?: string;
    email?: string;
    code: number;
    tags: string[];
    deactivated: boolean;
    createdAt: Date;
    updatedAt: Date;
    deliveryRoute: DeliveryRoute;

};

export const consumersSortNames = ['name', 'client.name', 'client.code', 'diet.description', 'diet.dietician.name', 'code', 'diet.code', 'createdAt'] as const;

export type ConsumersSortName = typeof consumersSortNames[number];

export type ConsumerCustomTable = {
    id: string;
    name?: string;
    code: string;
    client: {
        name: string;
        code: string;
        id: string;
    };
    clientId: string;
    diet: Diet;
    notes?: string;
    dietician: Dietician;
    deactivated?: boolean;
    createdAt: { $date: Date };
    allergens: Allergen[];
};

export const ordersSortNames = ['deliveryDay', 'status', 'client.name', 'client.code'] as const;
export type OrdersSortName = typeof ordersSortNames[number];

export const ordersGroupedByDaySortNames = ['deliveryDay'] as const;
export type OrdersGroupedByDaySortName = typeof ordersGroupedByDaySortNames[number];

export const ordersGroupedByMonthSortNames = ['id', 'breakfastStandard', 'lunchStandard', 'dinnerStandard', 'breakfastDiet', 'lunchDiet', 'dinnerDiet'] as const;
export type OrdersGroupedByMonthSortName = typeof ordersGroupedByMonthSortNames[number];

export const ordersGroupedByClientAndMonthSortNames = ['id', 'client.info.name', 'client.info.code', 'breakfastStandard', 'lunchStandard', 'dinnerStandard', 'breakfastDietCount', 'lunchDietCount', 'dinnerDietCount'] as const;
export type OrdersGroupedByClientAndMonthSortName = typeof ordersGroupedByClientAndMonthSortNames[number];

export type OrdersCustomTable = {
    id: string;
    deliveryDay: DeliveryDay;
    status: OrderStatus;
    client: {
        name: string;
        code: string;
        id: string;
    };
    clientId: string;
    breakfastStandard: number;
    lunchStandard: number;
    dinnerStandard: number;
    breakfastDietCount: number;
    lunchDietCount: number;
    dinnerDietCount: number;
    sentToCateringAt: { $date: Date };
};

export type OrderGroupedByDayCustomTable = {
    id: string,
    deliveryDay: DeliveryDay;
    breakfastStandard: number;
    lunchStandard: number;
    dinnerStandard: number;
    breakfastDietCount: number;
    lunchDietCount: number;
    dinnerDietCount: number;
    sentToCateringAt: { $date: Date };
}

export type OrderGroupedByMonthCustomTable = {
    id: string,
    breakfastStandard: number;
    breakfastDiet: number;
    lunchStandard: number;
    lunchDiet: number;
    dinnerStandard: number;
    dinnerDiet: number;
    sentToCateringAt: { $date: Date };
}

export type OrderGroupedByClientAndMonthCustomTable = {
    id: string,
    client: Client;
    breakfastStandard: number;
    breakfastDiet: number;
    lunchStandard: number;
    lunchDiet: number;
    dinnerStandard: number;
    dinnerDiet: number;
    sentToCateringAt: { $date: Date };
}

export type ConsumerMonthReport = Record<string, { name: string; breakfast: number; lunch: number; dinner: number; sum: number }>

export type OrderForView = {
    id: string;
    status: OrderStatus;
    standards: {
        breakfast: number;
        lunch: number;
        dinner: number;
    };
    diet: {
        breakfast: Array<Consumer & { diet: Diet | null }>;
        lunch: Array<Consumer & { diet: Diet | null }>;
        dinner: Array<Consumer & { diet: Diet | null }>;
    };
    day: {
        year: number;
        month: number;
        day: number;
    };
    notes: string;
};

export type TableType = typeof TableTypeValues[number];

export enum MealType {
    Breakfast = 'breakfast',
    Lunch = 'lunch',
    Dinner = 'dinner',
}

// export type OrderForEdit = z.infer<typeof orderForEditValid> & { status: OrderStatus };

export type OrderForEdit = {
    id: string;
    status: OrderStatus;
    standards: {
        breakfast: number;
        lunch: number;
        dinner: number;
    };
    diet: {
        breakfast: string[];
        lunch: string[];
        dinner: string[];
    };
    dietBeforeDeadline: {
        lunch: string[];
        dinner: string[];
    };
    day: {
        year: number;
        month: number;
        day: number;
    };
    notes: string;
};

export type ClientFilesCustomTable = {
    id: string;
    cateringId: string;
    info: ClientInfo;
    name?: string;
    code: string;
    menu: { id: string, s3Key: string }[];
    checklist: { id: string, s3Key: string }[];
    diets: { id: string, s3Key: string }[];
};

export type OrderMealPopulated = { consumer: Consumer & { diet: Diet } }

export type FoodCustomTable = {
    id: string;
    name: string;
    ingredients: string | null;
    foodCategory: FoodCategory | null;
    allergens: Allergen[];
}

export type FoodCustomObject = {
    id: string,
    name: string,
    ingredients: string | null,
    mealId: string | null,
    allergens: {
        id: string,
        name: string,
    }[]
}

export type ExclusionCustomTable = {
    id: string,
    name: string,
    allergens: Allergen[],
}

export type RegularMenuCustomObject = {
    id: string,
    day: {
        year: number,
        month: number,
        day: number,
    },
    foods: FoodCustomObject[],
}

export type ClientFoodAssignment =
    ConsumerFood & {
        regularMenu: RegularMenu;
        consumer: Consumer & {
            allergens: Array<ConsumerAllergen & { allergen: Allergen }>;
        };
        food: Food & {
            allergens: Array<FoodAllergen & { allergen: Allergen }>;
        };
        meal: Meal;
        exclusions: Array<ConsumerFoodExclusion & {
            exclusion: Exclusion & {
                allergens: Array<ExclusionAllergen & { allergen: Allergen }>;
            };
        }>;
    };
// ... existing code ...