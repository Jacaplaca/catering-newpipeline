import { HiX } from "react-icons/hi";
import { type FunctionComponent } from "react";

interface SelectedFoodsProps {
    selectedItems: { id: string; name: string, ingredients?: string | null, allergens: { id: string, name: string }[] }[];
    onRemove: (itemId: string) => void;
    onMouseEnter?: (itemId: string | null) => void;
    label?: string;
    iconClassName?: string;
    highlightedItems?: string[];
}

const SelectedFoods: FunctionComponent<SelectedFoodsProps> = ({
    selectedItems,
    onRemove,
    onMouseEnter,
    label = '',
    iconClassName = '',
    highlightedItems = [],
}) => {
    if (!selectedItems || selectedItems.length === 0) {
        return null;
    }

    const handleRemoveItem = (itemId: string) => {
        onRemove(itemId);
    };

    return (
        <div className="flex flex-wrap gap-2">
            {label && (
                <div className="w-full text-sm text-neutral-600 dark:text-neutral-300 font-medium flex items-center gap-2 mb-1">
                    {iconClassName && (
                        <i className={`${iconClassName} text-neutral-600 dark:text-neutral-300`} />
                    )}
                    {label}
                </div>
            )}
            {selectedItems.map((item) => {
                const isHighlighted = highlightedItems.includes(item.id);
                const backgroundClass = isHighlighted
                    ? 'bg-secondary/20 dark:bg-darkmode-secondary-accent/20'
                    : 'bg-neutral-200/50 dark:bg-neutral-700/50';

                return (
                    <div
                        key={item.id}
                        className={`cursor-pointer hover:bg-neutral-200/80 
                                dark:hover:bg-neutral-700
                                transition-colors duration-200 group rounded-lg max-w-[300px]
                                p-3 flex flex-col justify-between
                                ${backgroundClass}`}
                        // border border-neutral-200 dark:border-neutral-600
                        onClick={() => handleRemoveItem(item.id)}
                        onMouseEnter={() => onMouseEnter?.(item.id)}
                        onMouseLeave={() => onMouseEnter?.(null)}
                    >
                        <div className="flex items-start gap-2">
                            <div className="flex flex-col flex-grow">
                                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                                    {item.name}
                                </span>
                                <span className="text-xs text-neutral-700 dark:text-neutral-300">
                                    {item.ingredients}
                                </span>
                                {item.allergens && item.allergens.length > 0 && (
                                    <>
                                        <div className="my-1 border-t border-neutral-300 dark:border-neutral-600" />
                                        <div className="flex items-start gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                                            <span className="flex-1">
                                                {item.allergens.map((allergen) => allergen.name).join(', ')}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                            <HiX className="h-3 w-3 shrink-0 text-neutral-800 dark:text-neutral-50 group-hover:scale-110 transition-all duration-200 self-start" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SelectedFoods; 