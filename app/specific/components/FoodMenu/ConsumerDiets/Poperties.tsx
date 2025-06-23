import Tooltip from '@root/app/_components/ui/Tooltip';
import { type FC } from 'react';

const Property: FC<{
    value: boolean,
    label: string,
    trueIcon?: string
    falseIcon?: string
    trueColor?: string
    falseColor?: string
}> = ({ value, label, trueIcon = 'fa fa-check', falseIcon = 'fa fa-times', trueColor = 'text-green-500', falseColor = 'text-neutral-500' }) => {
    const colorClass = value ? trueColor : falseColor
    return (
        <Tooltip content={label}>
            <div className='flex gap-2 items-center justify-start'>
                <i className={`
            ${value ? trueIcon : falseIcon} text-sm ${colorClass}
            `} />
            </div>
        </Tooltip>
    )
}

export default Property;