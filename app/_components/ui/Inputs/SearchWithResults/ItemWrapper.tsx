import { type VirtualItem } from '@tanstack/react-virtual';
import { type FunctionComponent } from 'react';

export type ItemWrapperProps = {
    item?: { id: string, name: string };
    virtualRow: VirtualItem;
    isLoaderRow: boolean;
    onClick?: (item: { id: string, name: string }) => void;
    children: React.ReactNode;
    isSelected?: boolean;
}

const ItemWrapper: FunctionComponent<ItemWrapperProps> = ({ item, virtualRow, onClick, children, isSelected }) => {
    const clickable = onClick && item?.id;

    return (
        <div
            key={virtualRow.index ?? 'loader'}
            onClick={(onClick && item) ? () => onClick(item) : undefined}
            className={`absolute top-0 left-0 w-full
                flex items-center
                px-4
                border-b last:border-b-0
                border-gray-200 dark:border-neutral-700
                hover:bg-neutral-50 dark:hover:bg-neutral-700/90
                ${(clickable) ? 'cursor-pointer' : 'pointer-events-none'}
                ${isSelected ? 'bg-neutral-50 dark:bg-neutral-700/90' : ''}
                `}
            style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
            }}
        >
            {children}
        </div>
    );
}

export default ItemWrapper;

