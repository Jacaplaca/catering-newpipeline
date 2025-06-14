import { zodResolver } from '@hookform/resolvers/zod';
import { regularMenuCreateValidator, regularMenuEditValidator } from '@root/app/validators/specific/regularMenu';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { type z } from 'zod';
import { api } from '@root/app/trpc/react';
import type useMenuQueries from './useMenuQueries';

// Define the shape of the form values, including 'id' which is always present in the form state
type FoodSelectItem = { id: string; name: string, ingredients: string | null, allergens: { id: string, name: string }[], mealId: string | null };

interface RegularMenuFormValues {
    id: string;
    day: { year: number; month: number; day: number };
    foods: FoodSelectItem[];
}

interface UseStandardMenuProps {
    day: { year: number, month: number, day: number } | null;
    menuQueries: ReturnType<typeof useMenuQueries>;
    setTemplateDayObject: (dayObject: { id: string, name: string } | null) => void;
}

const FormSchema = regularMenuEditValidator.or(regularMenuCreateValidator);

const getEmptyValues = (day: { year: number, month: number, day: number } | null, id = ''): RegularMenuFormValues => {
    return {
        id: id ?? '',
        day: day ?? { year: 0, month: 0, day: 0 },
        foods: [],
    };
};

const useStandardMenu = (props: UseStandardMenuProps) => {
    const {
        day,
        menuQueries,
        setTemplateDayObject,
    } = props;
    const {
        existingMenu,
        menuFetching,
        menuLoading,
        templateDayMenu,
    } = menuQueries;

    const utils = api.useUtils();
    const [isEditing, setIsEditing] = useState(false);
    const [defaultFormValues, setDefaultFormValues] = useState<RegularMenuFormValues>(getEmptyValues(day));

    const backToDefault = () => {
        form.reset(defaultFormValues);
        setIsEditing(!!existingMenu);
        setTemplateDayObject(null);
    };

    const chooseTemplateDay = (dayObject: { id: string, name: string } | null) => {
        setTemplateDayObject(dayObject);
        if (!dayObject) {
            backToDefault();
        }
    }

    const updateMenu = (menu: { id: string, name: string, ingredients: string | null, allergens: { id: string, name: string }[] }[], mealId: string) => {
        const currentFoods = form.watch('foods');

        // Remove all foods with the same mealId
        const foodsWithoutCurrentMeal = currentFoods.filter(food => food.mealId !== mealId);

        // Add new foods with the mealId
        const updatedFoods = menu.map(food => ({ ...food, mealId }));

        // Combine: existing foods (without current mealId) + new foods
        const newFoods = [...foodsWithoutCurrentMeal, ...updatedFoods];

        form.setValue('foods', newFoods, { shouldDirty: true });
        setTemplateDayObject(null);
    }

    const form = useForm<RegularMenuFormValues>({
        resolver: zodResolver(FormSchema),
        defaultValues: defaultFormValues,
    });

    useEffect(() => {
        form.setValue('foods', templateDayMenu?.foods ?? [], { shouldDirty: true });
    }, [templateDayMenu, form]);

    useEffect(() => {
        if (day) {
            const newDefaults = getEmptyValues(day);
            if (existingMenu) {
                const foods = existingMenu.foods;
                if (foods) {
                    const menuData: RegularMenuFormValues = {
                        id: existingMenu.id,
                        day: existingMenu.day,
                        foods,
                    };
                    form.reset(menuData);
                    setDefaultFormValues(menuData);
                    setIsEditing(true);
                }
            } else {
                // If no existing menu for the day, and it's not loading, reset to defaults for creation
                if (!menuLoading && !menuFetching) {
                    form.reset(newDefaults);
                    setDefaultFormValues(newDefaults);
                    setIsEditing(false);
                }
            }
        } else {
            // If no day is selected, reset to initial empty state
            const initialDefaults = getEmptyValues(null);
            form.reset(initialDefaults);
            setDefaultFormValues(initialDefaults);
            setIsEditing(false);
        }
    }, [day, existingMenu, form, menuLoading, menuFetching]);

    useEffect(() => {
        setTemplateDayObject(null);
    }, [day, setTemplateDayObject]);


    const createMutation = api.specific.regularMenu.create.useMutation({
        onSuccess: () => {
            void utils.specific.regularMenu.getOne.invalidate();
            console.log('Menu created successfully');
        },
        onError: (error) => {
            console.error('Error creating menu:', error);
        },
    });

    const updateMutation = api.specific.regularMenu.update.useMutation({
        onSuccess: () => {
            void utils.specific.regularMenu.getOne.invalidate();
            console.log('Menu updated successfully');
        },
        onError: (error) => {
            console.error('Error updating menu:', error);
        },
    });

    const onSubmit = (values: RegularMenuFormValues) => {
        void utils.specific.regularMenu.getInfinite.invalidate();
        if (!day) {
            console.error("Cannot save, day is not selected.");
            return;
        }

        const submissionData = {
            ...values,
            day: day, // Ensure the correct day is part of the submission
        };

        if (isEditing && existingMenu?.id) {
            // The edit validator expects an 'id'
            updateMutation.mutate(submissionData as z.infer<typeof regularMenuEditValidator>);
        } else {
            // The create validator does not expect an 'id'
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...createData } = submissionData;
            createMutation.mutate(createData as z.infer<typeof regularMenuCreateValidator>);
        }
    };

    const clearForm = () => {
        const emptyValues = getEmptyValues(day, existingMenu?.id);
        form.reset(emptyValues);
        setIsEditing(true);
        setTemplateDayObject(null);
    };

    return {
        form,
        onSubmit: form.handleSubmit(onSubmit),
        isEditing,
        isLoading: menuLoading || menuFetching,
        isSubmitting: createMutation.isPending || updateMutation.isPending,
        updateMenu,
        clearForm,
        backToDefault,
        chooseTemplateDay,
    };
};

export default useStandardMenu;
