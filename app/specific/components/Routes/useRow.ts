import { zodResolver } from '@hookform/resolvers/zod';
import { type DeliveryRoute } from '@prisma/client';
import { type UpdateMessageType } from '@root/app/hooks/useMessage';
import translate from '@root/app/lib/lang/translate';
import { api } from '@root/app/trpc/react';
import { routeEditValidator } from '@root/app/validators/specific/deliveryRoute';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { type z } from 'zod';

const FormSchema = routeEditValidator;

const defaultValues = {
    id: '',
    name: '',
    code: '',
    description: '',
};

const useRouteRow = ({
    setRows,
    refetchAll,
    updateMessage,
    resetMessage,
    dictionary
}: {
    setRows: Dispatch<SetStateAction<DeliveryRoute[]>>
    refetchAll: () => Promise<void>
    updateMessage: UpdateMessageType,
    resetMessage: () => void
    dictionary: Record<string, string>
}) => {
    const [defaultForm, setDefaultForm] = useState<z.infer<typeof FormSchema>>(defaultValues);
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    const { data: fullRoute, refetch: fullRouteRefetch, isFetching: fullRouteFetching }
        = api.specific.deliveryRoute.getOne.useQuery(
            { id: expandedRowId ?? '' },
            { enabled: Boolean(expandedRowId) }
        );

    const [routeData, setRouteData] = useState<DeliveryRoute | null>(null);

    useEffect(() => {
        if (fullRoute) {
            setRouteData(fullRoute);
        }
    }, [fullRoute]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: defaultForm,
    });

    useEffect(() => {
        // resetMessage();
        if (routeData && expandedRowId) {
            const route = {
                id: routeData?.id ?? '',
                code: routeData?.code ?? '',
                name: routeData?.name ?? '',
                // description: routeData?.description ?? '',
            };
            form.reset(route);
            setDefaultForm(route);
        } else if (!expandedRowId) {
            form.reset(defaultValues);
            setDefaultForm(defaultValues);
        }
    }, [routeData, form, expandedRowId]);

    useEffect(() => {
        resetMessage();
    }, [expandedRowId, resetMessage]);


    useEffect(() => {
        if (fullRoute && expandedRowId) {
            setRows((state) => {
                return state.map((row) => {
                    if (row.id === fullRoute.id) {
                        return fullRoute;
                    }
                    return row;
                });
            });
        }
    }, [fullRoute, setRows, expandedRowId]);

    const submitFunction = expandedRowId
        ? api.specific.deliveryRoute.update
        : api.specific.deliveryRoute.create;

    const update = submitFunction.useMutation({
        onSuccess: async () => {
            expandedRowId
                ? await fullRouteRefetch()
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
        isFetching: fullRouteFetching,
        formData: defaultForm,
    };
};

export default useRouteRow;