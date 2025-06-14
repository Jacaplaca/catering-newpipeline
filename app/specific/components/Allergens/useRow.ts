import { zodResolver } from '@hookform/resolvers/zod';
import { type Allergen } from '@prisma/client';
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

const useAllergenRow = ({
    setRows,
    refetchAll,
    updateMessage,
    resetMessage,
    dictionary
}: {
    setRows: Dispatch<SetStateAction<Allergen[]>>
    refetchAll: () => Promise<void>
    updateMessage: UpdateMessageType,
    resetMessage: () => void
    dictionary: Record<string, string>
}) => {
    const [defaultForm, setDefaultForm] = useState<z.infer<typeof FormSchema>>(defaultValues);
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    const { data: fullAllergen, refetch: fullAllergenRefetch, isFetching: fullAllergenFetching }
        = api.specific.allergen.getOne.useQuery(
            { id: expandedRowId ?? '' },
            { enabled: Boolean(expandedRowId) }
        );

    const [allergenData, setAllergenData] = useState<Allergen | null>(null);

    useEffect(() => {
        if (fullAllergen) {
            setAllergenData(fullAllergen);
        }
    }, [fullAllergen]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: defaultForm,
    });

    useEffect(() => {
        // resetMessage();
        if (allergenData && expandedRowId) {
            const allergen = {
                id: allergenData?.id ?? '',
                name: allergenData?.name ?? '',
            };
            form.reset(allergen);
            setDefaultForm(allergen);
        } else if (!expandedRowId) {
            form.reset(defaultValues);
            setDefaultForm(defaultValues);
        }
    }, [allergenData, form, expandedRowId]);

    useEffect(() => {
        resetMessage();
    }, [expandedRowId, resetMessage]);


    useEffect(() => {
        if (fullAllergen && expandedRowId) {
            setRows((state) => {
                return state.map((row) => {
                    if (row.id === fullAllergen.id) {
                        return fullAllergen;
                    }
                    return row;
                });
            });
        }
    }, [fullAllergen, setRows, expandedRowId]);

    const submitFunction = expandedRowId
        ? api.specific.allergen.update
        : api.specific.allergen.create;

    const update = submitFunction.useMutation({
        onSuccess: async () => {
            expandedRowId
                ? await fullAllergenRefetch()
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
        isFetching: fullAllergenFetching,
        formData: defaultForm,
    };
};

export default useAllergenRow;