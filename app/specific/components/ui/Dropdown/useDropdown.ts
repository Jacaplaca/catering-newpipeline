import { useRef, useState } from 'react';

interface BaseItem {
    id: string;
    name: string;
}

const useDropdown = <T extends BaseItem>(
    onSelect: (item: T | null) => void,
    isMulti?: boolean
) => {
    const ref = useRef<HTMLDivElement>(null);
    const [searchValue, setSearchValue] = useState<string>('');
    const [isFocused, setIsFocused] = useState(false);
    const [key, setKey] = useState(0);

    function handleSelect(item: T | null) {
        if (!item) {
            onSelect(null);
            return;
        }
        onSelect(item);
    }

    const onResultClick = (item: T | null) => {
        handleSelect(item);
        if (!isMulti) {
            setIsFocused(false);
            setSearchValue('');
            setTimeout(() => {
                setKey(prevKey => prevKey + 1);
            }, 0);
        }
    }

    const updateValue = (value: string) => {
        if (value?.length) {
            handleSelect(null);
        }
        setSearchValue(value);
    };

    return {
        ref,
        searchValue,
        isFocused,
        key,
        updateValue,
        onResultClick,
        handleSelect,
        setIsFocused,
    }
}

export default useDropdown;
