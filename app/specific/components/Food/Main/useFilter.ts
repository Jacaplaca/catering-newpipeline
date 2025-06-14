import { useState } from 'react';

const useFoodFilter = () => {
    const [foodCategory, setFoodCategory] = useState<{ id: string, name: string } | null>(null);
    const [allergens, setAllergens] = useState<{ id: string, name: string }[]>([]);

    const [searchValue, setSearchValue] = useState<string>('');

    const addRemoveFoodCategory = (foodCategory: { id: string, name: string } | null) => {
        // console.log(foodCategory);
        // if (foodCategory === null) {
        //     setFoodCategory(null);
        //     return;
        // }

        // // Check if the same category is already selected
        // if (foodCategory && foodCategory.id === foodCategory?.id) {
        //     setFoodCategory(null); // Remove if same category
        // } else {
        //     setFoodCategory(foodCategory); // Set new category
        // }
        setFoodCategory(foodCategory);
    }

    const addRemoveAllergen = (allergensProp: { id: string, name: string }[]) => {
        setAllergens(allergensProp);
    }

    const search = (value: string) => {
        setSearchValue(value);
    }

    return {
        foodCategory,
        allergens,
        addRemoveFoodCategory,
        addRemoveAllergen,
        search,
        searchValue,
    };
};

export default useFoodFilter;