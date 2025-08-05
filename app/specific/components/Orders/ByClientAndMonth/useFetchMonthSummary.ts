import { format } from 'date-fns';
import { api } from '@root/app/trpc/react';

function useFetchMonthSummary({
    deliveryMonth
}: {
    deliveryMonth?: Date | null
}) {
    const formattedDeliveryMonth = deliveryMonth ? format(deliveryMonth, 'yyyy-MM') : '';

    const { data: report, isFetching }
        = api.specific.order.monthSummary.useQuery({ deliveryMonth: formattedDeliveryMonth }, {
            enabled: !!deliveryMonth,
        });

    return {
        report,
        isFetching,
    }
}

export default useFetchMonthSummary;
