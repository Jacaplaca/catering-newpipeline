import { format } from 'date-fns';
import { api } from '@root/app/trpc/react';
import { RoleType } from '@prisma/client';

function useFetchMonthSummary({
    deliveryMonth,
    role
}: {
    deliveryMonth?: Date | null
    role?: RoleType | null
}) {
    const formattedDeliveryMonth = deliveryMonth ? format(deliveryMonth, 'yyyy-MM') : '';
    const isManagerOrClient = role === RoleType.manager || role === RoleType.client;

    const { data: report, isFetching }
        = api.specific.order.monthSummary.useQuery({ deliveryMonth: formattedDeliveryMonth }, {
            enabled: !!deliveryMonth && isManagerOrClient,
        });

    return {
        report,
        isFetching,
    }
}

export default useFetchMonthSummary;
