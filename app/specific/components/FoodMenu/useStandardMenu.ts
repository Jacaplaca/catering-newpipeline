import { zodResolver } from '@hookform/resolvers/zod';
import { regularMenuCreateValidator, regularMenuEditValidator } from '@root/app/validators/specific/regularMenu';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { type z } from 'zod';
import { api } from '@root/app/trpc/react';
import type useMenuQueries from '@root/app/specific/components/FoodMenu/useMenuQueries';

// Define the shape of the form values, including 'id' which is always present in the form state
type FoodSelectItem = { id: string; name: string, order?: number | null, ingredients: string | null, allergens: { id: string, name: string }[], mealId: string | null };

interface RegularMenuFormValues {
    id: string;
    day: { year: number; month: number; day: number };
    foods: FoodSelectItem[];
}

interface UseStandardMenuProps {
    day: { year: number, month: number, day: number } | null;
    menuQueries: ReturnType<typeof useMenuQueries>;
    setTemplateDayObject: (dayObject: { id: string, name: string } | null) => void;
    clientId?: string | undefined | null;
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
        clientId,
    } = props;
    const {
        existingMenu,
        menuFetching,
        menuLoading,
        templateDayMenu,
        currentClient,
    } = menuQueries;

    const { data: currentClientMenu } = currentClient;

    const [defaultFormValues, setDefaultFormValues] = useState<RegularMenuFormValues>(getEmptyValues(day));
    const formAll = useForm<RegularMenuFormValues>({
        resolver: zodResolver(FormSchema),
        defaultValues: defaultFormValues,
    });

    const formClient = useForm<RegularMenuFormValues>({
        resolver: zodResolver(FormSchema),
        defaultValues: defaultFormValues,
    });

    const menuObj = clientId ? currentClientMenu : existingMenu;
    const form = clientId ? formClient : formAll;


    const utils = api.useUtils();
    const [isEditing, setIsEditing] = useState(false);

    const backToDefault = () => {
        form.reset(defaultFormValues);
        setIsEditing(!!menuObj);
        setTemplateDayObject(null);
    };

    const chooseTemplateDay = (dayObject: { id: string, name: string } | null) => {
        setTemplateDayObject(dayObject);
        if (!dayObject) {
            backToDefault();
        }
    }

    const updateMenu = (menu: { id: string, name: string, order?: number | null, ingredients: string | null, allergens: { id: string, name: string }[] }[], mealId: string) => {
        const currentFoods = form.watch('foods');

        // Find the highest order in ALL current foods first
        const maxOrder = currentFoods.reduce((max, food) => {
            const order = food.order ?? 0;
            return order > max ? order : max;
        }, 0);

        // Remove all foods with the same mealId
        const foodsWithoutCurrentMeal = currentFoods.filter(food => food.mealId !== mealId);

        // Add new foods with the mealId and assign sequential orders for items without order
        let nextOrder = maxOrder + 1;
        const updatedFoods = menu.map(food => {
            if (food.order === null || food.order === undefined) {
                return { ...food, mealId, order: nextOrder++ };
            }
            return { ...food, mealId };
        });

        // Combine: existing foods (without current mealId) + new foods
        const newFoods = [...foodsWithoutCurrentMeal, ...updatedFoods];

        form.setValue('foods', newFoods, { shouldDirty: true });
        setTemplateDayObject(null);
    }

    const updateFoodsOrder = (items: { id: string, order: number }[]) => {
        const currentFoods = form.watch('foods');
        const updatedFoods = currentFoods.map(food => {
            const item = items.find(i => i.id === food.id);
            return { ...food, order: item?.order ?? food.order };
        });
        form.setValue('foods', updatedFoods, { shouldDirty: true });
    }



    useEffect(() => {
        form.setValue('foods', templateDayMenu?.foods ?? [], { shouldDirty: true });
    }, [templateDayMenu, form]);

    useEffect(() => {
        if (day) {
            const newDefaults = getEmptyValues(day);
            if (menuObj) {
                const foods = menuObj.foods;
                if (foods) {
                    const menuData: RegularMenuFormValues = {
                        id: menuObj.id,
                        day: menuObj.day,
                        foods,
                    };
                    form.reset(menuData);
                    setDefaultFormValues(menuData);
                    setIsEditing(true);
                }
            } else {
                // // If no existing menu for the day, and it's not loading, reset to defaults for creation
                if (!menuLoading && !menuFetching && !clientId) {
                    form.reset(newDefaults);
                    setDefaultFormValues(newDefaults);
                    setIsEditing(false);
                }

                if (clientId && !menuObj && existingMenu) {

                    const foods = existingMenu.foods;
                    const menuData: RegularMenuFormValues = {
                        id: '',
                        day: existingMenu.day,
                        foods,
                    };
                    form.reset(menuData);
                    setDefaultFormValues(menuData);
                }


            }
        } else {
            // If no day is selected, reset to initial empty state
            const initialDefaults = getEmptyValues(null);
            form.reset(initialDefaults);
            setDefaultFormValues(initialDefaults);
            setIsEditing(false);
        }
    }, [day, menuObj, form, menuLoading, menuFetching, clientId, existingMenu]);

    useEffect(() => {
        setTemplateDayObject(null);
    }, [day, setTemplateDayObject]);


    const createMutation = api.specific.regularMenu.create.useMutation({
        onSuccess: () => {
            void utils.specific.regularMenu.getOne.invalidate();
            void utils.specific.regularMenu.configuredDays.invalidate();
            void utils.specific.regularMenu.getInfinite.invalidate();
            void utils.specific.regularMenu.getClientsWithCommonAllergens.invalidate();
            console.log('Menu created successfully');
        },
        onError: (error) => {
            console.error('Error creating menu:', error);
        },
    });

    const updateMutation = api.specific.regularMenu.update.useMutation({
        onSuccess: () => {
            console.log('Menu updated successfully');
            void utils.specific.regularMenu.getOne.invalidate();
            void utils.specific.regularMenu.getClientsWithCommonAllergens.invalidate();
            console.log('Menu updated successfully');
        },
        onError: (error) => {
            console.error('Error updating menu:', error);
        },
    });

    // const onSubmit = (values: RegularMenuFormValues) => {
    //     void utils.specific.regularMenu.getInfinite.invalidate();
    //     if (!day) {
    //         console.error("Cannot save, day is not selected.");
    //         return;
    //     }

    //     const submissionData = {
    //         ...values,
    //         day: day, // Ensure the correct day is part of the submission
    //     };

    //     if (isEditing && menuObj?.id) {
    //         // The edit validator expects an 'id'
    //         updateMutation.mutate(submissionData as z.infer<typeof regularMenuEditValidator>);
    //     } else {
    //         // The create validator does not expect an 'id'
    //         // eslint-disable-next-line @typescript-eslint/no-unused-vars
    //         const { id, ...createData } = submissionData;
    //         createMutation.mutate(createData as z.infer<typeof regularMenuCreateValidator>);
    //     }
    // };

    const handleSubmit = (clientId?: string) => {
        console.log('handleSubmit', clientId);
        return form.handleSubmit((values: RegularMenuFormValues) => {
            void utils.specific.regularMenu.getInfinite.invalidate();
            if (!day) {
                console.error("Cannot save, day is not selected.");
                return;
            }

            const submissionData = {
                ...values,
                day: day,
                clientId, // Add clientId to submission data
            };

            if (isEditing && menuObj?.id) {
                updateMutation.mutate(submissionData as z.infer<typeof regularMenuEditValidator>);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id, ...createData } = submissionData;
                createMutation.mutate(createData as z.infer<typeof regularMenuCreateValidator>);
            }
        });
    };

    const clearForm = () => {
        const emptyValues = getEmptyValues(day, menuObj?.id);
        form.reset(emptyValues);
        setIsEditing(true);
        setTemplateDayObject(null);
    };

    return {
        form,
        formAll,
        formClient,
        onSubmit: handleSubmit, // Return the new function that accepts clientId
        isEditing,
        isLoading: menuLoading || menuFetching,
        isSubmitting: createMutation.isPending || updateMutation.isPending,
        updateMenu,
        clearForm,
        backToDefault,
        chooseTemplateDay,
        updateFoodsOrder,
    };
};

export default useStandardMenu;
