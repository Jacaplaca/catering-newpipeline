import { api } from '@root/app/trpc/react';
import { MealType } from '@root/types/specific';
import { useEffect, useState } from 'react';

const useConsumersPick = ({
    selectedIds,
    updateSelected,
    allowedIds,
    clientId,
    meal
}: {
    selectedIds: string[],
    updateSelected: (ids: string[]) => void,
    allowedIds?: string[],
    clientId?: string,
    meal: MealType
}) => {


    const [selectedItems, setSelectedItems] = useState<{ id: string, name: string, code: string }[]>([]);

    const [inputValue, setInputValue] = useState<string>('');
    const { data: allItems, isLoading } = api.specific.consumer.dietaryAll.useQuery({ clientId: clientId ?? '' }, { enabled: !!clientId });

    let allowedItems = allowedIds ? allItems?.filter(item => allowedIds.includes(item.id)) : allItems;
    allowedItems = meal === MealType.Breakfast ? allItems : allowedItems;

    const [filteredItems, setFilteredItems] = useState<{ id: string, name: string, code: string }[]>(allowedItems ?? []);

    const searchConsumers = (value: string) => {
        setInputValue(value);
        setFilteredItems(allowedItems?.filter(item => item?.name?.toLowerCase().includes(value.toLowerCase())) ?? []);
    }

    const selectAll = () => {
        // setSelectedItems(allItems?.map(item => ({ id: item.id, name: item.name })) ?? []);
        updateSelected(allowedItems?.map(item => item.id) ?? []);
    }

    const deselectAll = () => {
        // setSelectedItems([]);
        updateSelected([]);
    }

    useEffect(() => {
        if (allowedItems) {
            const newSelectedItems = selectedIds.map(id => {
                const item = allowedItems?.find(item => item.id === id);
                return item ? { id, name: item.name, code: item.code } : { id, name: '', code: '' };
            });

            if (JSON.stringify(newSelectedItems) !== JSON.stringify(selectedItems)) {
                setSelectedItems(newSelectedItems);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedIds, allowedItems]);

    return {
        searchConsumers,
        isLoading,
        selectedItems,
        allItems,
        searchValue: inputValue,
        filteredItems,
        selectAll,
        deselectAll,
    }
}

export default useConsumersPick;