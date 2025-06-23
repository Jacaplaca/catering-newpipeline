const getCommonAllergens = ({
    consumerAllergens,
    foodAllergens,
    comment,
    exclusionAllergens
}: {
    consumerAllergens: { id: string, name: string }[],
    foodAllergens: { id: string, name: string }[],
    exclusionAllergens: { id: string, name: string }[],
    comment?: string | null
}) => {
    if (comment && comment.trim() !== '') {
        return [];
    }

    const exclusionAllergenIds = new Set(exclusionAllergens.map(allergen => allergen.id));

    const commonWithFood = consumerAllergens.filter(consumerAllergen =>
        foodAllergens.some(foodAllergen => foodAllergen.id === consumerAllergen.id)
    );

    return commonWithFood.filter(allergen => !exclusionAllergenIds.has(allergen.id));
};

export default getCommonAllergens;