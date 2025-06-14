import useDay from './useDay';
import useStandardMenu from '@root/app/specific/components/FoodMenu/useStandardMenu';
import { useState } from 'react';
import useMenuQueries from './useMenuQueries';
import { type SettingParsedType } from '@root/types';
import useMealQueries from '@root/app/hooks/calls/useMealQueries';

const useFoodMenu = ({
    lang,
    pageName,
    settings,
    dictionary,
}: {
    lang: LocaleApp,
    pageName: string,
    settings: { main: SettingParsedType },
    dictionary: Record<string, string>,
}) => {

    const day = useDay();
    const { data: meals } = useMealQueries();
    const [templateDayObject, setTemplateDayObject] = useState<{ id: string, name: string } | null>(null);

    const menuQueries = useMenuQueries(day.day, templateDayObject);

    const standardMenuForm = useStandardMenu({
        day: day.day,
        menuQueries,
        setTemplateDayObject,
    });

    const getFoodsByMealId = (mealId: string) => {
        const foods = standardMenuForm.form.watch('foods');
        return foods?.filter(item => item?.mealId === mealId) ?? [];
    }

    const getAllergens = (mealId: string) => {
        const foodList = standardMenuForm.form.watch('foods');
        const filteredFoods = (foodList ?? []).filter(item => item?.mealId === mealId);
        const allAllergensOfMeal = filteredFoods.flatMap(item => item?.allergens ?? []);
        return Array.from(new Map(allAllergensOfMeal.map(allergen => [allergen.id, allergen])).values());
    }

    const getAllAllergensFromAllTypes = () => {
        const foods = standardMenuForm.form.watch('foods');
        if (!foods) {
            return [];
        }
        const allAllergens = foods.flatMap(item => item?.allergens ?? []);
        return Array.from(new Map(allAllergens.map(allergen => [allergen.id, allergen])).values());
    }

    const checkIfFormNotEmpty = () => {
        const foods = standardMenuForm.form.watch('foods');
        if (!foods) {
            return false;
        }
        return foods.length > 0;
    };

    return {
        pageName,
        lang,
        dictionary,
        day,
        standardMenuForm,
        menuQueries,
        templateDayObject,
        getAllergens,
        getAllAllergensFromAllTypes,
        isMenuEdited: !!standardMenuForm.form.formState.dirtyFields.foods,
        checkIfFormNotEmpty,
        settings,
        isFormNotEmpty: checkIfFormNotEmpty(),
        meals,
        getFoodsByMealId,
    }
};
export default useFoodMenu;