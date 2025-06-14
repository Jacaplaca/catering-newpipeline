import { useRef, useState } from 'react';

const useDropdownMultiple = ({
    onItemsChange,
    selectedItems,
    limitItems,
}: {
    onItemsChange: (items: { id: string, name: string }[]) => void;
    selectedItems: { id: string, name: string }[];
    limitItems?: number;
}) => {
    const [searchValue, setSearchValue] = useState<string>('');
    const ref = useRef<HTMLDivElement>(null);

    const searchItems = (value: string) => {
        setSearchValue(value);
    }

    const chooseItems = (item: { id: string, name: string } | null) => {
        if (!onItemsChange) return;

        if (!item) {
            onItemsChange([]);
            return;
        }

        const currentItems = selectedItems ?? [];
        const itemExists = currentItems.some(i => i.id === item.id);

        if (itemExists) {
            const updatedItems = currentItems.filter(i => i.id !== item.id);
            onItemsChange(updatedItems);
        } else {
            const newItems = [...currentItems, item];
            if (limitItems && newItems.length > limitItems) {
                onItemsChange(newItems.slice(-limitItems));
            } else {
                onItemsChange(newItems);
            }
        }
    };

    const onResultClick = (item: { id: string, name: string } | null) => {
        chooseItems(item);
    }

    const handleRemoveItem = (itemId: string) => {
        if (!onItemsChange) return;

        const currentItems = selectedItems ?? [];
        const updatedItems = currentItems.filter(item => item.id !== itemId);
        onItemsChange(updatedItems);
    };

    return {
        searchValue,
        searchItems,
        chooseItems,
        onResultClick,
        handleRemoveItem,
        ref,
    }
};

export default useDropdownMultiple;
