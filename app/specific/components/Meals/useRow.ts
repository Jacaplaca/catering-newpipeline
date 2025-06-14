import { zodResolver } from '@hookform/resolvers/zod';
import { type Meal } from '@prisma/client';
import { type UpdateMessageType } from '@root/app/hooks/useMessage';
import translate from '@root/app/lib/lang/translate';
import { api } from '@root/app/trpc/react';
import { mealEditValidator } from '@root/app/validators/specific/meal';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { type z } from 'zod';

const FormSchema = mealEditValidator;

const defaultValues = {
    id: '',
    name: '',
};

const useMealRow = ({
    setRows,
    refetchAll,
    updateMessage,
    resetMessage,
    dictionary
}: {
    setRows: Dispatch<SetStateAction<Meal[]>>
    refetchAll: () => Promise<void>
    updateMessage: UpdateMessageType,
    resetMessage: () => void
    dictionary: Record<string, string>
}) => {
    const [defaultForm, setDefaultForm] = useState<z.infer<typeof FormSchema>>(defaultValues);
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    const { data: fullMeal, refetch: fullMealRefetch, isFetching: fullMealFetching }
        = api.specific.meal.getOne.useQuery(
            { id: expandedRowId ?? '' },
            { enabled: Boolean(expandedRowId) }
        );

    const [mealData, setMealData] = useState<Meal | null>(null);

    useEffect(() => {
        if (fullMeal) {
            setMealData(fullMeal);
        }
    }, [fullMeal]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: defaultForm,
    });

    useEffect(() => {
        // resetMessage();
        if (mealData && expandedRowId) {
            const meal = {
                id: mealData?.id ?? '',
                name: mealData?.name ?? '',
            };
            form.reset(meal);
            setDefaultForm(meal);
        } else if (!expandedRowId) {
            form.reset(defaultValues);
            setDefaultForm(defaultValues);
        }
    }, [mealData, form, expandedRowId]);

    useEffect(() => {
        resetMessage();
    }, [expandedRowId, resetMessage]);


    useEffect(() => {
        if (fullMeal && expandedRowId) {
            setRows((state) => {
                return state.map((row) => {
                    if (row.id === fullMeal.id) {
                        return fullMeal;
                    }
                    return row;
                });
            });
        }
    }, [fullMeal, setRows, expandedRowId]);

    const submitFunction = expandedRowId
        ? api.specific.meal.update
        : api.specific.meal.create;

    const update = submitFunction.useMutation({
        onSuccess: async () => {
            expandedRowId
                ? await fullMealRefetch()
                : await refetchAll();
            updateMessage('saved');
        },
        onError: (error) => {
            console.log(error.data, error.message, error.shape);
            updateMessage({ content: translate(dictionary, error.message), status: 'error' });
        },
    });

    const onSubmit = (values: z.infer<typeof FormSchema>) => {
        updateMessage('saving');
        update.mutate(values);
    };

    const onRowClick = (key: string | null) => {
        setExpandedRowId(state => state === key ? null : key);
        form.reset(defaultValues);
    };

    return {
        onRowClick,
        expandedRowId,
        update,
        form,
        onSubmit: form.handleSubmit(onSubmit),
        isFetching: fullMealFetching,
        formData: defaultForm,
    };
};

export default useMealRow;