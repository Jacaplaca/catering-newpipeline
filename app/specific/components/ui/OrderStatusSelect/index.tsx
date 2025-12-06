"use client";

import { type OrderStatus } from '@prisma/client';
import SimpleDropdown from '@root/app/_components/ui/SimpleDropdown';
import { orderStatusDictionary } from '@root/app/assets/maps/catering';
import Status from '@root/app/specific/components/ui/OrderStatusSelect/Status';
import { DropdownItem } from "flowbite-react";
import { type FC } from 'react';

const OrderStatusSelect: FC<{
    dictionary: Record<string, string>,
    status: OrderStatus | null,
    changeStatus: (status: OrderStatus | null) => void,
    omitStatus?: OrderStatus
}> = ({ dictionary, status, changeStatus, omitStatus }) => {
    return (
        <SimpleDropdown
            label=""
            dismissOnClick={true}
            renderTrigger={() => (
                <div className='cursor-pointer'>
                    <Status status={status} dictionary={dictionary} size='sm' />
                </div>
            )}
        >
            <div className="p-1">
                <DropdownItem
                    key="null"
                    onClick={() => changeStatus(null)}
                >
                    <Status status={null} dictionary={dictionary} size='sm' />
                </DropdownItem>
                {Object.keys(orderStatusDictionary).map(statusKey => {
                    if (omitStatus && statusKey === omitStatus) return null;
                    const currentStatus = statusKey as OrderStatus;
                    return (
                        <DropdownItem
                            key={statusKey}
                            onClick={() => changeStatus(currentStatus)}
                        >
                            <Status status={currentStatus} dictionary={dictionary} size='sm' />
                        </DropdownItem>
                    );
                })}
            </div>
        </SimpleDropdown>
    );
}

export default OrderStatusSelect;