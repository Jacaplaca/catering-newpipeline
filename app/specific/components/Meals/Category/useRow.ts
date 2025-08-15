import { zodResolver } from '@hookform/resolvers/zod';
import { type MealCategory } from '@prisma/client';
import { type UpdateMessageType } from '@root/app/hooks/useMessage';
import translate from '@root/app/lib/lang/translate';
import { api } from '@root/app/trpc/react';
import { mealCategoryEditValidator } from '@root/app/validators/specific/mealCategory';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { type z } from 'zod';

const FormSchema = mealCategoryEditValidator;

const defaultValues = {
    id: '',
    name: '',
};

const useMealCategoryRow = ({
    setRows,
    refetchAll,
    updateMessage,
    resetMessage,
    dictionary
}: {
    setRows: Dispatch<SetStateAction<MealCategory[]>>
    refetchAll: () => Promise<void>
    updateMessage: UpdateMessageType,
    resetMessage: () => void
    dictionary: Record<string, string>
}) => {
    const [defaultForm, setDefaultForm] = useState<z.infer<typeof FormSchema>>(defaultValues);
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    const { data: fullMealCategory, refetch: fullMealCategoryRefetch, isFetching: fullMealCategoryFetching }
        = api.specific.mealCategory.getOne.useQuery(
            { id: expandedRowId ?? '' },
            { enabled: Boolean(expandedRowId) }
        );

    const [mealCategoryData, setMealCategoryData] = useState<MealCategory | null>(null);

    useEffect(() => {
        if (fullMealCategory) {
            setMealCategoryData(fullMealCategory);
        }
    }, [fullMealCategory]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: defaultForm,
    });

    useEffect(() => {
        // resetMessage();
        if (mealCategoryData && expandedRowId) {
            const mealCategory = {
                id: mealCategoryData?.id ?? '',
                name: mealCategoryData?.name ?? '',
            };
            form.reset(mealCategory);
            setDefaultForm(mealCategory);
        } else if (!expandedRowId) {
            form.reset(defaultValues);
            setDefaultForm(defaultValues);
        }
    }, [mealCategoryData, form, expandedRowId]);

    useEffect(() => {
        resetMessage();
    }, [expandedRowId, resetMessage]);


    useEffect(() => {
        if (fullMealCategory && expandedRowId) {
            setRows((state) => {
                return state.map((row) => {
                    if (row.id === fullMealCategory.id) {
                        return fullMealCategory;
                    }
                    return row;
                });
            });
        }
    }, [fullMealCategory, setRows, expandedRowId]);

    const submitFunction = expandedRowId
        ? api.specific.mealCategory.update
        : api.specific.mealCategory.create;

    const update = submitFunction.useMutation({
        onSuccess: async () => {
            expandedRowId
                ? await fullMealCategoryRefetch()
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
        isFetching: fullMealCategoryFetching,
        formData: defaultForm,
    };
};

export default useMealCategoryRow;