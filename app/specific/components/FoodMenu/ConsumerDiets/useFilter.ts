import { useState } from 'react';

const LIMIT_ITEMS = 1;

const useConsumerDietsFilter = () => {
    const [allergens, setAllergens] = useState<{ id: string, name: string }[]>([]);
    const [consumerAllergens, setConsumerAllergens] = useState<{ id: string, name: string }[]>([]);
    const [foodAllergens, setFoodAllergens] = useState<{ id: string, name: string }[]>([]);
    const [foods, setFoods] = useState<{ id: string, name: string, ingredients: string | null, allergens: { id: string, name: string }[] }[]>([]);

    const addRemoveConsumerAllergen = (consumerAllergensProp: { id: string, name: string }[]) => {
        // Limit the number of selected items based on LIMIT_ITEMS, keeping the most recently added
        const limitedExclusions = consumerAllergensProp.slice(-LIMIT_ITEMS);
        setConsumerAllergens(limitedExclusions);
    }

    const addRemoveFoodAllergen = (foodAllergensProp: { id: string, name: string }[]) => {
        const limitedFoodAllergens = foodAllergensProp.slice(-LIMIT_ITEMS);
        setFoodAllergens(limitedFoodAllergens);
    }

    const addRemoveFood = (foodsProp: { id: string, name: string }[]) => {
        const limitedFoods = foodsProp.slice(-LIMIT_ITEMS);

        const foodsMapped = limitedFoods.map(food => ({
            id: food.id,
            name: food.name,
            ingredients: null,
            allergens: []
        }));
        setFoods(foodsMapped);
    }

    const addRemoveAllergen = (allergensProp: { id: string, name: string }[]) => {
        const limitedAllergens = allergensProp.slice(-LIMIT_ITEMS);
        setAllergens(limitedAllergens);
    }

    const clearAllergens = () => {
        setAllergens([]);
    }

    return {
        allergens,
        consumerAllergens,
        foodAllergens,
        foods,
        addRemoveConsumerAllergen,
        addRemoveFoodAllergen,
        addRemoveFood,
        addRemoveAllergen,
        clearAllergens,
    };
};

export default useConsumerDietsFilter;
