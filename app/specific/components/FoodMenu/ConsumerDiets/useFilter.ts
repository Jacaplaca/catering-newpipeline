import { useState } from 'react';

const useConsumerDietsFilter = () => {
    const [allergens, setAllergens] = useState<{ id: string, name: string }[]>([]);
    const addRemoveAllergen = (allergensProp: { id: string, name: string }[]) => {
        setAllergens(allergensProp);
    }

    const clearAllergens = () => {
        setAllergens([]);
    }

    return {
        allergens,
        addRemoveAllergen,
        clearAllergens,
    };
};

export default useConsumerDietsFilter;