import orderedDates from '@root/app/server/api/routers/specific/order/orderedDates';
import save from '@root/app/server/api/routers/specific/order/save';
import getTable from '@root/app/server/api/routers/specific/order/table';
import getOne from '@root/app/server/api/routers/specific/order/getOne';
import deleteMany from '@root/app/server/api/routers/specific/order/delete';
import complete from '@root/app/server/api/routers/specific/order/complete';
import groupedByDay from '@root/app/server/api/routers/specific/order/groupedByDay';
import dayPdf from '@root/app/server/api/routers/specific/order/dayPdf';
import groupedByMonth from '@root/app/server/api/routers/specific/order/groupedByMonth';
import labelsPdf from '@root/app/server/api/routers/specific/order/labelsPdf';
import monthByClient from '@root/app/server/api/routers/specific/order/month';
import routesPdf from '@root/app/server/api/routers/specific/order/routesPdf';
const orderRouter = {
    ...save,
    orderedDates,
    ...getTable,
    ...getOne,
    deleteMany,
    complete,
    groupedByDay,
    dayPdf,
    groupedByMonth,
    labelsPdf,
    monthByClient,
    routesPdf,
}



export default orderRouter;