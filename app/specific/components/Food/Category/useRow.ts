import { zodResolver } from '@hookform/resolvers/zod';
import { type FoodCategory } from '@prisma/client';
import { type UpdateMessageType } from '@root/app/hooks/useMessage';
import translate from '@root/app/lib/lang/translate';
import { api } from '@root/app/trpc/react';
import { allergenEditValidator } from '@root/app/validators/specific/allergen';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { type z } from 'zod';

const FormSchema = allergenEditValidator;

const defaultValues = {
    id: '',
    name: '',
};

const useFoodCategoryRow = ({
    setRows,
    refetchAll,
    updateMessage,
    resetMessage,
    dictionary
}: {
    setRows: Dispatch<SetStateAction<FoodCategory[]>>
    refetchAll: () => Promise<void>
    updateMessage: UpdateMessageType,
    resetMessage: () => void
    dictionary: Record<string, string>
}) => {
    const [defaultForm, setDefaultForm] = useState<z.infer<typeof FormSchema>>(defaultValues);
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    const { data: fullFoodCategory, refetch: fullFoodCategoryRefetch, isFetching: fullFoodCategoryFetching }
        = api.specific.foodCategory.getOne.useQuery(
            { id: expandedRowId ?? '' },
            { enabled: Boolean(expandedRowId) }
        );

    const [foodCategoryData, setFoodCategoryData] = useState<FoodCategory | null>(null);

    useEffect(() => {
        if (fullFoodCategory) {
            setFoodCategoryData(fullFoodCategory);
        }
    }, [fullFoodCategory]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: defaultForm,
    });

    useEffect(() => {
        // resetMessage();
        if (foodCategoryData && expandedRowId) {
            const foodCategory = {
                id: foodCategoryData?.id ?? '',
                name: foodCategoryData?.name ?? '',
            };
            form.reset(foodCategory);
            setDefaultForm(foodCategory);
        } else if (!expandedRowId) {
            form.reset(defaultValues);
            setDefaultForm(defaultValues);
        }
    }, [foodCategoryData, form, expandedRowId]);

    useEffect(() => {
        resetMessage();
    }, [expandedRowId, resetMessage]);


    useEffect(() => {
        if (fullFoodCategory && expandedRowId) {
            setRows((state) => {
                return state.map((row) => {
                    if (row.id === fullFoodCategory.id) {
                        return fullFoodCategory;
                    }
                    return row;
                });
            });
        }
    }, [fullFoodCategory, setRows, expandedRowId]);

    const submitFunction = expandedRowId
        ? api.specific.foodCategory.update
        : api.specific.foodCategory.create;

    const update = submitFunction.useMutation({
        onSuccess: async () => {
            expandedRowId
                ? await fullFoodCategoryRefetch()
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
        isFetching: fullFoodCategoryFetching,
        formData: defaultForm,
    };
};

export default useFoodCategoryRow;