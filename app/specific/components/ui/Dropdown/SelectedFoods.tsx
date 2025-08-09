import { HiX } from "react-icons/hi";
import { type FunctionComponent, useMemo, useState, useEffect } from "react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    arrayMove,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SelectedFoodItem {
    id: string;
    name: string;
    order?: number | null;
    ingredients?: string | null;
    allergens: { id: string; name: string }[];
}

interface SelectedFoodsProps {
    selectedItems: SelectedFoodItem[];
    onRemove: (itemId: string) => void;
    onMouseEnter?: (itemId: string | null) => void;
    label?: string;
    iconClassName?: string;
    highlightedItems?: string[];
    fullWidth?: boolean;
    updateFoodsOrder?: (items: { id: string, order: number }[]) => void;
}

const SortableSelectedItem: FunctionComponent<{
    item: SelectedFoodItem;
    isHighlighted: boolean;
    onRemove: (itemId: string) => void;
    onMouseEnter?: (itemId: string | null) => void;
    fullWidth: boolean;
}> = ({ item, isHighlighted, onRemove, onMouseEnter, fullWidth }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

    const backgroundClass = isHighlighted
        ? 'bg-secondary/20 dark:bg-darkmode-secondary-accent/20'
        : 'bg-neutral-200/50 dark:bg-neutral-700/50';

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    } as React.CSSProperties;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`cursor-grab active:cursor-grabbing hover:bg-neutral-200/80 dark:hover:bg-neutral-700 transition-colors duration-200 group rounded-lg ${fullWidth ? 'max-w-full' : 'w-[300px]'} p-3 flex flex-col justify-between ${backgroundClass} ${isDragging ? 'opacity-80 ring-2 ring-secondary/40' : ''}`}
            onMouseEnter={() => onMouseEnter?.(item.id)}
            onMouseLeave={() => onMouseEnter?.(null)}
            {...attributes}
            {...listeners}
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
                                    {item.allergens.map(({ name }) => name).join(', ')}
                                </span>
                            </div>
                        </>
                    )}
                </div>
                <button
                    type="button"
                    aria-label="Remove item"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(item.id);
                    }}
                    className="p-1 rounded hover:bg-neutral-300/60 dark:hover:bg-neutral-600/60 transition-colors"
                >
                    <HiX className="h-3 w-3 shrink-0 text-neutral-800 dark:text-neutral-50 group-hover:scale-110 transition-all duration-200 self-start" />
                </button>
            </div>
        </div>
    );
};

const SelectedFoods: FunctionComponent<SelectedFoodsProps> = ({
    selectedItems,
    onRemove,
    onMouseEnter,
    label = '',
    iconClassName = '',
    highlightedItems = [],
    fullWidth = false,
    updateFoodsOrder,
}) => {
    // Optimistic state for immediate UI updates
    const [optimisticItems, setOptimisticItems] = useState<SelectedFoodItem[] | null>(null);
    const [pendingOrderUpdate, setPendingOrderUpdate] = useState<{ id: string; order: number }[] | null>(null);

    // Reset optimistic state when we get data from DB that matches our pending update
    useEffect(() => {
        if (optimisticItems && pendingOrderUpdate && selectedItems.length > 0) {
            // Check if the DB data matches our pending update
            const dbOrderMatches = pendingOrderUpdate.every(pendingItem => {
                const dbItem = selectedItems.find(item => item.id === pendingItem.id);
                return dbItem && dbItem.order === pendingItem.order;
            });

            if (dbOrderMatches) {
                setOptimisticItems(null);
                setPendingOrderUpdate(null);
            }
        }
    }, [selectedItems, optimisticItems, pendingOrderUpdate]);

    // Use optimistic items if available, otherwise use sorted items from props
    const displayItems = useMemo(() => {
        if (optimisticItems) {
            return optimisticItems;
        }
        return [...selectedItems].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }, [optimisticItems, selectedItems]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    );

    const itemIds = useMemo(() => displayItems.map((it) => it.id), [displayItems]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = displayItems.findIndex((it) => it.id === String(active.id));
        const newIndex = displayItems.findIndex((it) => it.id === String(over.id));
        if (oldIndex === -1 || newIndex === -1) return;

        // Optimistic update - show new order immediately
        const reorderedItems = arrayMove(displayItems, oldIndex, newIndex).map((it, idx) => ({
            ...it,
            order: idx,
        }));
        setOptimisticItems(reorderedItems);

        // Calculate order data for database
        const orderData = reorderedItems.map((it, idx) => ({
            id: it.id,
            order: idx,
        }));
        setPendingOrderUpdate(orderData);

        updateFoodsOrder?.(orderData);
    };

    if (!displayItems || displayItems.length === 0) {
        return null;
    }

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
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={itemIds} strategy={rectSortingStrategy}>
                    {displayItems.map((item) => (
                        <SortableSelectedItem
                            key={item.id}
                            item={item}
                            isHighlighted={highlightedItems.includes(item.id)}
                            onRemove={onRemove}
                            onMouseEnter={onMouseEnter}
                            fullWidth={!!fullWidth}
                        />
                    ))}
                </SortableContext>
            </DndContext>
        </div>
    );
};

export default SelectedFoods; 