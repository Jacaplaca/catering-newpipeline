import type { OrderConsumerBreakfast, OrderConsumerLunch, OrderConsumerDinner } from '@prisma/client';
import type { OrderMealPopulated } from '@root/types/specific';

const processMeals = (meals: (OrderConsumerBreakfast & OrderMealPopulated | OrderConsumerLunch & OrderMealPopulated | OrderConsumerDinner & OrderMealPopulated)[]) => {
    return meals.filter(meal => meal.consumer.code).reduce((acc, meal) => {
        const code = meal.consumer.code;
        if (code) {
            acc[code] = {
                code: meal.consumer.diet?.code ? meal.consumer.diet?.code : '---',
                description: meal.consumer.diet?.description ? meal.consumer.diet?.description : '',
                consumerId: meal.consumerId,
            };
        }
        return acc;
    }, {} as Record<string, { code: string, description: string, consumerId: string }>);
}

export default processMeals;