import orderedDates from '@root/app/server/api/routers/specific/order/orderedDates';
import save from '@root/app/server/api/routers/specific/order/save';
import getTable from '@root/app/server/api/routers/specific/order/table';
import getOne from '@root/app/server/api/routers/specific/order/getOne';
import deleteMany from '@root/app/server/api/routers/specific/order/delete';
import complete from '@root/app/server/api/routers/specific/order/complete';
import groupedByDay from '@root/app/server/api/routers/specific/order/groupedByDay';
import dayPdf from '@root/app/server/api/routers/specific/order/dayPdf';
import dayPdf2 from '@root/app/server/api/routers/specific/order/dayPdf2';
import groupedByMonth from '@root/app/server/api/routers/specific/order/groupedByMonth';
import labelsPdf from '@root/app/server/api/routers/specific/order/labelsPdf';
import labelsPdf2 from '@root/app/server/api/routers/specific/order/labelsPdf2';
import monthByClient from '@root/app/server/api/routers/specific/order/month';
import routesPdf from '@root/app/server/api/routers/specific/order/routesPdf';
import monthSummary from '@root/app/server/api/routers/specific/order/monthSummary';
import dayMenuPdf from '@root/app/server/api/routers/specific/libs/consumerFoods/dayMenuPdf';
const orderRouter = {
    ...save,
    orderedDates,
    ...getTable,
    ...getOne,
    deleteMany,
    complete,
    groupedByDay,
    dayPdf,
    dayPdf2,
    groupedByMonth,
    labelsPdf,
    labelsPdf2,
    monthByClient,
    monthSummary,
    routesPdf,
    dayMenuPdf,
}



export default orderRouter;