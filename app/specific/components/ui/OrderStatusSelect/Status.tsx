import { OrderStatus } from '@prisma/client';
import { orderStatusDictionary } from '@root/app/assets/maps/catering';
import translate from '@root/app/lib/lang/translate';
import { Badge, type BadgeSizes } from "flowbite-react";
import { type FC } from 'react';

const statusColor: Record<OrderStatus | 'default', string> = {
    [OrderStatus.draft]: 'bg-blue-300 dark:bg-blue-700',
    [OrderStatus.in_progress]: 'bg-rose-300 dark:bg-rose-700',
    [OrderStatus.completed]: 'bg-lime-300 dark:bg-lime-700',
    default: 'bg-neutral-200 dark:bg-neutral-700'
};

const Status: FC<{
    status: OrderStatus | null,
    dictionary: Record<string, string>,
    size?: keyof BadgeSizes & string
}> = ({ status, dictionary, size = 'xs' }) => {
    const colorClass = statusColor[status ?? 'default'];

    return <div className='flex justify-center'>
        <Badge
            size={size}
            color="light"
            className={`
        ${colorClass}
        text-gray-900 dark:text-gray-100 font-semibold flex justify-center
        whitespace-nowrap font-xs sm:font-sm p-1 px-2 sm:p-2 sm:px-4
        `}>{translate(dictionary, status ? orderStatusDictionary[status] : 'orders:status_all')}</Badge>
    </div>
}

export default Status;
