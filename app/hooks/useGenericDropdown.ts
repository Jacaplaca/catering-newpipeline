import { useRef, useState } from 'react';

interface BaseItem {
    id: string;
    name: string;
}

export const useGenericDropdown = <T extends BaseItem>(
    onSelect: (selectedObj: T | null) => void,
    isMulti?: boolean
) => {
    const ref = useRef<HTMLDivElement>(null);
    const [inputValue, setInputValue] = useState<string>('');
    const [isFocused, setIsFocused] = useState(false);
    const [key, setKey] = useState(0);

    function handleSelect(id: string | null, allItems: T[]) {
        if (!id) {
            onSelect(null);
            return;
        }
        const selectedObj = allItems.find(item => item.id === id);
        onSelect(selectedObj ?? null);
    }

    const onResultClick = (id: string | null, allItems: T[]) => {
        handleSelect(id, allItems);
        if (!isMulti) {
            setIsFocused(false);
            setKey(prevKey => prevKey + 1);
        }
    }

    const updateValue = (value: string) => {
        if (value?.length) {
            handleSelect(null, []);
        }
        setInputValue(value);
    };

    return {
        ref,
        inputValue,
        isFocused,
        key,
        updateValue,
        onResultClick,
        handleSelect,
        setIsFocused,
    }
}

export type { BaseItem };