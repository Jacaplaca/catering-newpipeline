import { createTRPCRouter } from "server/api/trpc";
import media from '@root/app/server/api/routers/specific/media';
import settings from '@root/app/server/api/routers/specific/settings';
import dietician from '@root/app/server/api/routers/specific/dietician';
import kitchen from '@root/app/server/api/routers/specific/kitchen';
import consumer from '@root/app/server/api/routers/specific/consumer';
import client from '@root/app/server/api/routers/specific/client';
import order from '@root/app/server/api/routers/specific/order';
import clientFiles from '@root/app/server/api/routers/specific/clientFiles';
import deliveryRoute from '@root/app/server/api/routers/specific/deliveryRoute';
import allergen from '@root/app/server/api/routers/specific/allergen';
import foodCategory from '@root/app/server/api/routers/specific/foodCategory';
import food from '@root/app/server/api/routers/specific/food';
import regularMenu from '@root/app/server/api/routers/specific/regularMenu';
import consumerFood from '@root/app/server/api/routers/specific/consumerFood';
import meal from '@root/app/server/api/routers/specific/meal';
import exclusion from '@root/app/server/api/routers/specific/exclusion';
import mealCategory from '@root/app/server/api/routers/specific/mealCategory';
import mealGroup from '@root/app/server/api/routers/specific/mealGroup';
import publicData from '@root/app/server/api/routers/specific/publicData';
// Ensure that each of these routers is created by createTRPCRouter
const specificRouter = createTRPCRouter({
    client,
    media,
    settings: createTRPCRouter({
        ...settings,
        hasFinished: settings.hasFinished,
        get: settings.get
    }),
    dietician,
    kitchen,
    consumer,
    order,
    clientFiles,
    deliveryRoute,
    allergen,
    foodCategory,
    food,
    regularMenu,
    consumerFood,
    meal,
    exclusion,
    mealCategory,
    mealGroup,
    publicData,
});

export default specificRouter;