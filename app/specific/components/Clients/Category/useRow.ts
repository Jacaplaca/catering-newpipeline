import { zodResolver } from '@hookform/resolvers/zod';
import { type ClientCategory } from '@prisma/client';
import { type UpdateMessageType } from '@root/app/hooks/useMessage';
import translate from '@root/app/lib/lang/translate';
import { api } from '@root/app/trpc/react';
import { clientCategoryEditValidator } from '@root/app/validators/specific/clientCategory';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { type z } from 'zod';

const FormSchema = clientCategoryEditValidator;

const defaultValues = {
    id: '',
    name: '',
    code: '',
};

const useClientCategoryRow = ({
    setRows,
    refetchAll,
    updateMessage,
    resetMessage,
    dictionary
}: {
    setRows: Dispatch<SetStateAction<ClientCategory[]>>
    refetchAll: () => Promise<void>
    updateMessage: UpdateMessageType,
    resetMessage: () => void
    dictionary: Record<string, string>
}) => {
    const [defaultForm, setDefaultForm] = useState<z.infer<typeof FormSchema>>(defaultValues);
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    const { data: clientCategory, refetch: clientCategoryRefetch, isFetching: clientCategoryFetching }
        = api.specific.clientCategory.getOne.useQuery(
            { id: expandedRowId ?? '' },
            { enabled: Boolean(expandedRowId) }
        );

    const [clientCategoryData, setClientCategoryData] = useState<ClientCategory | null>(null);

    useEffect(() => {
        if (clientCategory) {
            setClientCategoryData(clientCategory);
        }
    }, [clientCategory]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: defaultForm,
    });

    useEffect(() => {
        // resetMessage();
        if (clientCategoryData && expandedRowId) {
            const clientCategory = {
                id: clientCategoryData?.id ?? '',
                name: clientCategoryData?.name ?? '',
            };
            form.reset(clientCategoryData);
            setDefaultForm(clientCategoryData);
        } else if (!expandedRowId) {
            form.reset(defaultValues);
            setDefaultForm(defaultValues);
        }
    }, [clientCategoryData, form, expandedRowId]);

    useEffect(() => {
        resetMessage();
    }, [expandedRowId, resetMessage]);


    useEffect(() => {
        if (clientCategoryData && expandedRowId) {
            setRows((state) => {
                return state.map((row) => {
                    if (row.id === clientCategoryData.id) {
                        return clientCategoryData;
                    }
                    return row;
                });
            });
        }
    }, [clientCategoryData, setRows, expandedRowId]);

    const submitFunction = expandedRowId
        ? api.specific.clientCategory.update
        : api.specific.clientCategory.create;

    const update = submitFunction.useMutation({
        onSuccess: async () => {
            expandedRowId
                ? await clientCategoryRefetch()
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
        isFetching: clientCategoryFetching,
        formData: defaultForm,
    };
};

export default useClientCategoryRow;