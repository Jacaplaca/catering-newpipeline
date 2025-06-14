import { zodResolver } from '@hookform/resolvers/zod';
import { type UpdateMessageType } from '@root/app/hooks/useMessage';
import translate from '@root/app/lib/lang/translate';
import { api } from '@root/app/trpc/react';
import { exclusionEditValidator } from '@root/app/validators/specific/exclusion';
import { type ExclusionCustomTable } from '@root/types/specific';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { type z } from 'zod';

const FormSchema = exclusionEditValidator;

const defaultValues = {
    id: '',
    name: '',
    ingredients: '',
    foodCategory: undefined,
    allergens: [],
};

const useExclusionRow = ({
    setRows,
    refetchAll,
    updateMessage,
    resetMessage,
    dictionary
}: {
    setRows: Dispatch<SetStateAction<ExclusionCustomTable[]>>
    refetchAll: () => Promise<void>
    updateMessage: UpdateMessageType,
    resetMessage: () => void
    dictionary: Record<string, string>
}) => {
    const [defaultForm, setDefaultForm] = useState<z.infer<typeof FormSchema>>(defaultValues);
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    const { data: fullFood, refetch: fullFoodRefetch, isFetching: fullFoodFetching }
        = api.specific.exclusion.getOne.useQuery(
            { id: expandedRowId ?? '' },
            { enabled: Boolean(expandedRowId) }
        );

    const [foodData, setFoodData] = useState<ExclusionCustomTable | null>(null);

    useEffect(() => {
        if (fullFood) {
            setFoodData(fullFood);
        }
    }, [fullFood]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: defaultForm,
    });

    useEffect(() => {
        // resetMessage();
        if (foodData && expandedRowId) {
            const food = {
                id: foodData?.id ?? '',
                name: foodData?.name ?? '',
                allergens: foodData?.allergens ?? [],
            };
            form.reset(food);
            setDefaultForm(food);
        } else if (!expandedRowId) {
            form.reset(defaultValues);
            setDefaultForm(defaultValues);
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
        ? api.specific.exclusion.update
        : api.specific.exclusion.create;

    const update = submitFunction.useMutation({
        onSuccess: async () => {
            expandedRowId
                ? await fullFoodRefetch()
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
        isFetching: fullFoodFetching,
        formData: defaultForm,
    };
};

export default useExclusionRow; 