import { type FunctionComponent } from "react";

interface SelectedDisplayProps {
    selectedItems: { id: string; name: string }[];
    onRemove?: (itemId: string) => void;
    onMouseEnter?: (itemId: string | null) => void;
    label?: string;
    iconClassName?: string;
    highlightedItems?: string[];
    noBorder?: boolean;
    noBackground?: boolean;
    crossedItems?: string[];
    clearAll?: () => void;
    clearAllLabel?: string;
}

const SelectedDisplay: FunctionComponent<SelectedDisplayProps> = ({
    selectedItems,
    onRemove,
    onMouseEnter,
    label = '',
    iconClassName = '',
    highlightedItems = [],
    noBorder = false,
    noBackground = false,
    crossedItems,
    clearAll,
    clearAllLabel
}) => {
    if (!selectedItems || selectedItems.length === 0) {
        return null;
    }

    const handleRemoveItem = (itemId: string) => {
        onRemove?.(itemId);
    };

    return (
        <div className={`flex flex-wrap gap-2 p-2 ${!noBackground ? 'bg-neutral-50 dark:bg-neutral-800' : ''} rounded-md ${!noBorder ? 'border border-neutral-200 dark:border-neutral-600' : ''}`}>
            <div className="flex items-center justify-between w-full">
                <div className="text-sm text-neutral-600 dark:text-neutral-300 font-medium mr-2 flex items-center gap-2">
                    {iconClassName && (
                        <i className={`${iconClassName} text-neutral-600 dark:text-neutral-300`} />
                    )}
                    {label}
                </div>
                {clearAll && clearAllLabel && (
                    <button
                        onClick={clearAll}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 
                                 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 
                                 rounded-md transition-colors duration-200"
                        title={clearAllLabel}
                    >
                        <i className="fas fa-trash text-xs" />
                        {clearAllLabel}
                    </button>
                )}
            </div>
            {selectedItems.map((item) => {
                const isHighlighted = highlightedItems.includes(item.id);
                const isCrossed = crossedItems?.includes(item.id);
                const backgroundClass = isHighlighted
                    ? 'bg-secondary/70 dark:bg-darkmode-secondary-accent/80'
                    : 'bg-secondary/50 dark:bg-neutral-700';

                return (
                    <div
                        key={item.id}
                        onClick={onRemove ? () => handleRemoveItem(item.id) : undefined}
                        onMouseEnter={() => onMouseEnter?.(item.id)}
                        onMouseLeave={() => onMouseEnter?.(null)}
                        className={`group inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium
                                transition-colors duration-200
                                ${onRemove ? 'cursor-pointer hover:bg-secondary/80 dark:hover:bg-darkmode-secondary-accent' : ''}
                                ${backgroundClass}`}
                    >
                        <span
                            className={`${isCrossed
                                ? 'line-through text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50'
                                : 'text-neutral-900 dark:text-neutral-50'
                                }`}
                        >
                            {item.name}
                        </span>
                        {onRemove && (
                            <i className="fas fa-times text-xs text-neutral-800 dark:text-neutral-50 group-hover:scale-110 transition-all duration-200" />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default SelectedDisplay; 