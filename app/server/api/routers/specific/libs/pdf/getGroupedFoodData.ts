import { mealGroup2orderField } from '@root/app/assets/maps/catering';
import dayIdParser from '@root/app/server/api/routers/specific/libs/dayIdParser';
import getGroupedConsumerFoodDataObject, { type RoutesByIdMap, type RoutesWithConsumersByIdMap } from '@root/app/server/api/routers/specific/libs/getGroupedConsumerFoodDataObject';
import { db } from '@root/app/server/db';
import { type MealType } from '@root/types/specific';

type GroupedFoodDataByMeal = {
    consumerFoodByRoute: RoutesByIdMap;
    mealGroupName: string;
    orderIds: string[];
    mealGroupId: string;
};

type GroupedFoodDataByConsumer = {
    consumerFoodByRoute: RoutesWithConsumersByIdMap;
    mealGroupName: string;
    orderIds: string[];
    mealGroupId: string;
};

function getGroupedFoodData(args: { dayId: string; mealId?: string; mealGroupIdProp?: string; cateringId: string; groupBy: 'byConsumer'; }): Promise<GroupedFoodDataByConsumer>;
function getGroupedFoodData(args: { dayId: string; mealId?: string; mealGroupIdProp?: string; cateringId: string; groupBy?: 'byMeal'; }): Promise<GroupedFoodDataByMeal>;
async function getGroupedFoodData({ dayId, mealId, mealGroupIdProp, cateringId, groupBy = 'byMeal' }: { dayId: string, mealId?: string, mealGroupIdProp?: string, cateringId: string, groupBy?: 'byMeal' | 'byConsumer' }): Promise<GroupedFoodDataByMeal | GroupedFoodDataByConsumer> {

    const { year, month, day } = dayIdParser(dayId);
    const meal = mealId ? await db.meal.findUnique({
        where: {
            id: mealId
        },
        include: {
            mealGroup: {
                include: {
                    meals: true
                }
            }
        }
    }) : null;

    const mealGroupData = mealGroupIdProp ? await db.mealGroup.findUnique({
        where: {
            id: mealGroupIdProp
        },
        include: {
            meals: true
        }
    }) : null;


    // if (!meal?.mealGroup) {
    //     throw new Error('Meal not found');
    // }
    const mealGroup = meal?.mealGroup ?? mealGroupData;
    if (!mealGroup) {
        throw new Error('Meal group not found');
    }
    const { name: mealGroupName, id: mealGroupId, meals } = mealGroup;
    const mealIds = meals.map(({ id }) => id);

    const relevantOrderIds = await db.order.findMany({
        where: {
            cateringId,
            status: { not: 'draft' },
            deliveryDay: {
                year,
                month,
                day
            }
        },
        select: {
            id: true
        }
    });

    const orderIds = relevantOrderIds.map(o => o.id);

    const dietCollectionName = mealGroup2orderField[mealGroupId as MealType].dietCollection;

    const pipeline = {
        pipeline: [
            { $match: { orderId: { $in: orderIds } } },
            { $group: { _id: '$consumerId' } }
        ],
    }

    type AggregationResult = { _id: string };
    let results: AggregationResult[] | undefined;

    switch (dietCollectionName) {
        case 'OrderConsumerBreakfast':
            results = await db.orderConsumerBreakfast.aggregateRaw(pipeline) as unknown as AggregationResult[];
            break;

        case 'OrderConsumerLunch':
            results = await db.orderConsumerLunch.aggregateRaw(pipeline) as unknown as AggregationResult[];
            break;

        case 'OrderConsumerDinner':
            results = await db.orderConsumerDinner.aggregateRaw(pipeline) as unknown as AggregationResult[];
            break;

        default:
            throw new Error(`Unsupported diet collection: ${dietCollectionName}`);
    }
    const consumerIds = results ? results.map(doc => String(doc._id)) : [];

    if (groupBy === 'byConsumer') {
        const consumerFoodByRoute = await getGroupedConsumerFoodDataObject({
            cateringId,
            mealIds,
            dayObj: { year, month, day },
            consumerIds,
            groupBy
        });
        return { consumerFoodByRoute, mealGroupName, orderIds, mealGroupId };
    } else {
        const consumerFoodByRoute = await getGroupedConsumerFoodDataObject({
            cateringId,
            mealIds,
            dayObj: { year, month, day },
            consumerIds,
            groupBy
        });
        return { consumerFoodByRoute, mealGroupName, orderIds, mealGroupId };
    }
}

export default getGroupedFoodData;