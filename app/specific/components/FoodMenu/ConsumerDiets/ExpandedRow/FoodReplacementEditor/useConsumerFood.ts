import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@root/app/trpc/react';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
import { useState, useMemo, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { type z } from 'zod';
import { consumerFoodValidator } from '@root/app/validators/specific/consumerFood';
import { type ClientFoodAssignment } from '@root/types/specific';

const FormSchema = consumerFoodValidator;
type ConsumerFoodReplacementFormValues = z.infer<typeof FormSchema>;

const useConsumerFood = (assignment: ClientFoodAssignment) => {
    const { id, meal, consumer, food, exclusions, comment, alternativeFood, ignoredAllergens } = assignment;
    const { day: { day }, rowClick: { expandedRowId } } = useFoodMenuContext();
    const utils = api.useUtils();
    const [isEditing, setIsEditing] = useState(!!assignment.id);

    // In the future, you would fetch existing data for a given day and consumer
    // const { data: existingReplacement, refetch, isLoading } = api.specific.consumerFoodReplacement.getOne.useQuery({ day, consumerId }, {
    //     enabled: !!day && !!consumerId,
    // });

    const defaultValues = useMemo(() => ({
        id: assignment.id,
        food: {
            id: food.id,
            name: food.name,
            ingredients: food.ingredients,
            allergens: food.allergens.map(a => ({ id: a.allergen.id, name: a.allergen.name })),
        },
        alternativeFood: {
            id: alternativeFood?.id ?? '',
            name: alternativeFood?.name ?? '',
            ingredients: alternativeFood?.ingredients ?? null,
            allergens: alternativeFood?.allergens.map(a => ({ id: a.allergen.id, name: a.allergen.name })) ?? [],
        },
        exclusions: exclusions.map(({ exclusion }) => ({
            id: exclusion.id,
            name: exclusion.name,
            allergens: exclusion.allergens.map(({ allergen }) => ({
                id: allergen.id,
                name: allergen.name,
            })),
        })),
        comment: comment ?? '',
        ignoredAllergens: ignoredAllergens ?? [],
    }), [assignment.id, food, exclusions, comment, alternativeFood, ignoredAllergens]);

    const form = useForm<ConsumerFoodReplacementFormValues>({
        resolver: zodResolver(FormSchema),
        defaultValues,
    });

    useEffect(() => {
        form.reset(defaultValues);
        setIsEditing(!!assignment.id);
    }, [assignment.id, defaultValues, form]);

    // --- NEW: obserwacja alergenów z formularza + wyliczenie wspólnych ---
    const watchedFoodAllergens = useWatch({
        control: form.control,
        name: 'food.allergens',
        defaultValue: food.allergens.map(a => ({ id: a.allergen.id, name: a.allergen.name })),
    });

    const watchedAlternativeFoodId = useWatch({
        control: form.control,
        name: 'alternativeFood.id',
        defaultValue: alternativeFood?.id ?? '',
    });

    const watchedAlternativeFoodAllergens = useWatch({
        control: form.control,
        name: 'alternativeFood.allergens',
        defaultValue: alternativeFood?.allergens.map(a => ({ id: a.allergen.id, name: a.allergen.name })) ?? [],
    });

    const watchedExclusions = useWatch({
        control: form.control,
        name: 'exclusions',
        defaultValue: [],
    });

    const watchedIgnoredAllergens = useWatch({
        control: form.control,
        name: 'ignoredAllergens',
        defaultValue: [],
    });

    const allExcludedAllergenIds = useMemo(() => {
        return new Set(
            (watchedExclusions ?? [])
                .flatMap(ex => ex?.allergens ?? [])
                .map(({ id }) => id),
        );
    }, [watchedExclusions]);

    const allExcludedAllergen = useMemo(() => {
        return (watchedExclusions ?? []).flatMap(ex => ex?.allergens ?? []);
    }, [watchedExclusions]);

    const commonAllergens = useMemo(() => {
        const consumerAllergenIds = new Set(consumer.allergens.map(({ allergen }) => allergen.id));

        // Use alternativeFood allergens if alternativeFood is selected, otherwise use food allergens
        const relevantAllergens = watchedAlternativeFoodId && watchedAlternativeFoodId.trim() !== ''
            ? watchedAlternativeFoodAllergens
            : watchedFoodAllergens;

        return (relevantAllergens ?? []).filter(
            (allergen, index, self) =>
                consumerAllergenIds.has(allergen.id) &&              // wspólne konsument-posiłek
                !allExcludedAllergenIds.has(allergen.id) &&            // pomniejszone o exclusions
                !watchedIgnoredAllergens?.includes(allergen.id) &&      // pomniejszone o ignoredAllergens
                self.findIndex(a => a.id === allergen.id) === index, // unikalność
        );
    }, [watchedFoodAllergens, watchedAlternativeFoodAllergens, watchedAlternativeFoodId, allExcludedAllergenIds, consumer.allergens, watchedIgnoredAllergens]);
    // --------------------------------------------------------------------

    // useEffect(() => {
    //     if (existingReplacement) {
    //         form.reset(existingReplacement);
    //         setIsEditing(true);
    //     } else {
    //         // Reset to default values for creation
    //         form.reset({
    //             day,
    //             consumerId,
    //             harmfulFoodId: '',
    //             safeFoods: [],
    //             comment: '',
    //         });
    //         setIsEditing(false);
    //     }
    // }, [existingReplacement, day, consumerId, form]);

    const updateMutation = api.specific.consumerFood.update.useMutation({
        onSuccess: () => {
            // Invalidate relevant queries to refetch data, for example, a list of replacements.
            // await utils.specific.consumerFoodReplacement.invalidate();
            console.log('Food replacement created successfully');
            // You might want to call refetch() here if you have one.
            void utils.specific.regularMenu.getClientsWithCommonAllergens.invalidate();
        },
        onError: (error) => {
            console.error('Error creating food replacement:', error);
            // Handle and display error messages to the user.
        },
        onSettled: () => {
            void utils.specific.consumerFood.getByClientId.invalidate({
                clientId: consumer.clientId,
                day: day ?? undefined,
            });
        },
    });

    // const updateMutation = api.specific.consumerFoodReplacement.update.useMutation({
    //     onSuccess: async () => {
    //         await utils.specific.consumerFoodReplacement.invalidate();
    //         // await refetch();
    //         console.log('Food replacement updated successfully');
    //     },
    //     onError: (error) => {
    //         console.error('Error updating food replacement:', error);
    //     },
    // });

    const onSubmit = (values: ConsumerFoodReplacementFormValues) => {
        updateMutation.mutate(values);
    };

    const updateFood = (value: { id: string, name: string }[]) => {
        const first = value[0] as { id: string, name: string, ingredients: string | null, allergens: { id: string, name: string }[] };
        if (first) {
            form.setValue('food', {
                id: first.id,
                name: first.name,
                ingredients: null,
                allergens: first.allergens.map(a => ({ id: a.id, name: a.name })),
            }, { shouldValidate: true, shouldDirty: true });
        } else {
            // Revert to initial food when selection is cleared
            form.setValue('food', {
                id: food.id,
                name: food.name,
                ingredients: food.ingredients,
                allergens: food.allergens.map(a => ({ id: a.allergen.id, name: a.allergen.name })),
            }, { shouldValidate: true, shouldDirty: true });
        }
        void form.trigger();
    }

    const updateAlternativeFood = (value: { id: string, name: string }[]) => {
        const first = value[0] as { id: string, name: string, ingredients: string | null, allergens: { id: string, name: string }[] };
        if (first) {
            form.setValue('alternativeFood', {
                id: first.id,
                name: first.name,
                ingredients: first.ingredients,
                allergens: first.allergens.map(a => ({ id: a.id, name: a.name })),
            }, { shouldValidate: true, shouldDirty: true });
        } else {
            form.setValue('alternativeFood', {
                id: alternativeFood?.id ?? '',
                name: alternativeFood?.name ?? '',
                ingredients: alternativeFood?.ingredients ?? null,
                allergens: alternativeFood?.allergens.map(a => ({ id: a.allergen.id, name: a.allergen.name })) ?? [],
            }, { shouldValidate: true, shouldDirty: true });
        }
        void form.trigger();
    }

    const updateExclusions = (value: { id: string, name: string }[]) => {
        form.setValue('exclusions', value as { id: string, name: string, allergens: { id: string, name: string }[] }[], { shouldValidate: true, shouldDirty: true });
        void form.trigger();
    }

    const ignoreAllergen = (allergenId: string) => {
        const currentIgnored = watchedIgnoredAllergens ?? [];
        const isAlreadyIgnored = currentIgnored.includes(allergenId);

        const updatedIgnored = isAlreadyIgnored
            ? currentIgnored.filter(id => id !== allergenId)
            : [...currentIgnored, allergenId];

        form.setValue('ignoredAllergens', updatedIgnored, { shouldValidate: true, shouldDirty: true });
        void form.trigger();
    }



    return {
        form,
        onSubmit: form.handleSubmit(onSubmit),
        isEditing,
        isSubmitting: updateMutation.isPending,
        commonAllergens,
        updateFood,
        updateExclusions,
        allExcludedAllergen,
        updateAlternativeFood,
        ignoreAllergen,
        // similarComments,
        // isSimilarLoading,
        // existingReplacement,
        // isLoading,
        // refetch,
    };
}

export default useConsumerFood;