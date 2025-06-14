import { useState } from 'react';

const useExclusionFilter = () => {
    const [allergens, setAllergens] = useState<{ id: string, name: string }[]>([]);

    const [searchValue, setSearchValue] = useState<string>('');

    const addRemoveAllergen = (allergensProp: { id: string, name: string }[]) => {
        setAllergens(allergensProp);
    }

    const search = (value: string) => {
        setSearchValue(value);
    }

    return {
        allergens,
        addRemoveAllergen,
        search,
        searchValue,
    };
};

export default useExclusionFilter;