import { zodResolver } from '@hookform/resolvers/zod';
import { type UpdateMessageType } from '@root/app/hooks/useMessage';
import translate from '@root/app/lib/lang/translate';
import { api } from '@root/app/trpc/react';
import { foodEditValidator } from '@root/app/validators/specific/food';
import { type FoodCustomTable } from '@root/types/specific';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { type z } from 'zod';

const FormSchema = foodEditValidator;

const defaultValues = {
    id: '',
    name: '',
    ingredients: '',
    foodCategory: undefined,
    allergens: [],
};

const useFoodRow = ({
    setRows,
    refetchAll,
    updateMessage,
    resetMessage,
    dictionary,
    afterSubmit
}: {
    setRows: Dispatch<SetStateAction<FoodCustomTable[]>>
    refetchAll: () => Promise<void>
    updateMessage: UpdateMessageType,
    resetMessage: () => void
    dictionary: Record<string, string>
    afterSubmit: () => void
}) => {
    // const [defaultForm, setDefaultForm] = useState<z.infer<typeof FormSchema>>();
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    const { data: fullFood, refetch: fullFoodRefetch, isFetching: fullFoodFetching }
        = api.specific.food.getOne.useQuery(
            { id: expandedRowId ?? '' },
            { enabled: Boolean(expandedRowId) }
        );

    const [foodData, setFoodData] = useState<FoodCustomTable>();

    useEffect(() => {
        if (fullFood) {
            setFoodData(fullFood);
        }
    }, [fullFood]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: defaultValues,
    });

    useEffect(() => {
        // resetMessage();
        if (foodData && expandedRowId) {
            // Transform foodData to match form schema
            const formData = {
                id: foodData.id,
                name: foodData.name,
                ingredients: foodData.ingredients ?? '',
                foodCategory: foodData.foodCategory ? {
                    id: foodData.foodCategory.id,
                    name: foodData.foodCategory.name
                } : undefined,
                allergens: foodData.allergens || []
            };

            form.reset(formData);
            // setDefaultForm(food);
        } else if (!expandedRowId) {
            form.reset();
            // setDefaultForm(defaultValues);
        }
    }, [foodData, form, expandedRowId]);

    useEffect(() => {
        resetMessage();
    }, [expandedRowId, resetMessage]);


    useEffect(() => {
        if (fullFood && expandedRowId) {
            setRows((state) => {
                return state.map((row) => {
                    if (row.id === fullFood.id) {
                        return fullFood;
                    }
                    return row;
                });
            });
        }
    }, [fullFood, setRows, expandedRowId]);

    const submitFunction = expandedRowId
        ? api.specific.food.update
        : api.specific.food.create;

    const update = submitFunction.useMutation({
        onSuccess: async () => {
            expandedRowId
                ? await fullFoodRefetch()
                : await refetchAll();
            updateMessage('saved');
            afterSubmit();
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
        isFetching: fullFoodFetching,
        // formData: defaultValues,
    };
};

export default useFoodRow;