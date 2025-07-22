import { zodResolver } from '@hookform/resolvers/zod';
import { type DeliveryRoute } from '@prisma/client';
import { type UpdateMessageType } from '@root/app/hooks/useMessage';
import translate from '@root/app/lib/lang/translate';
// import useTags from '@root/app/specific/components/Clients/ExpandedRow/useTags';
import { api } from '@root/app/trpc/react';
import { clientEditValidator } from '@root/app/validators/specific/client';
import { type ClientCustomTable } from '@root/types/specific';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { type z } from 'zod';

const FormSchema = clientEditValidator;
const useClientRow = ({
    setRows,
    dictionary,
    updateMessage,
    resetMessage
}: {
    setRows: Dispatch<SetStateAction<ClientCustomTable[]>>,
    dictionary: Record<string, string>,
    updateMessage: UpdateMessageType,
    resetMessage: () => void
}) => {
    const utils = api.useUtils();



    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);



    // const { data: fullClient, isFetching: fullClientFetching } = api.specific.client.getOne.useQuery(
    //     { id: expandedRowId ?? '' },
    //     { enabled: Boolean(expandedRowId) }
    // );

    const { data: client, isFetching: fullClientFetching } = api.specific.client.getOne.useQuery(
        { id: expandedRowId ?? '' },
        { enabled: Boolean(expandedRowId) }
    );

    const [clientData, setClientData] = useState<typeof client | null>(null);



    useEffect(() => {
        if (client) {
            setClientData(client);
        }
    }, [client]);

    const defaultValues = {
        id: '',
        name: '',
        code: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        zip: '',
        country: '',
        contactPerson: '',
        notes: '',
        // tags: [],
        firstOrderDeadline: '',
        secondOrderDeadline: '',
        deliveryRoute: null,
        allowWeekendOrder: false,
    };

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues
    });

    useEffect(() => {
        if (clientData && expandedRowId) {
            const client = {
                id: clientData?.id ?? '',
                name: clientData?.info.name ?? '',
                code: clientData?.info.code ?? '',
                email: clientData?.info.email ?? '',
                phone: clientData?.info.phone ?? '',
                address: clientData?.info.address ?? '',
                city: clientData?.info.city ?? '',
                zip: clientData?.info.zip ?? '',
                country: clientData?.info.country ?? '',
                contactPerson: clientData?.info.contactPerson ?? '',
                notes: clientData?.info.notes ?? '',
                // tags: clientData?.tags.map((tag) => tag.tag.name) ?? [],
                firstOrderDeadline: clientData?.info.firstOrderDeadline ?? '',
                deliveryRoute: clientData?.deliveryRoute ? { id: clientData.deliveryRoute._id, name: clientData.deliveryRoute.name } : null,
                secondOrderDeadline: clientData?.info.secondOrderDeadline ?? '',
                allowWeekendOrder: clientData?.info.allowWeekendOrder ?? false,
            };
            form.reset(client);
        } else if (!expandedRowId) {
            form.reset(defaultValues);
        }
        resetMessage();
    }, [clientData, form, expandedRowId]);


    useEffect(() => {
        if (client) {
            setRows((state) => {
                return state.map((row) => {
                    if (row.id === client.id) {
                        return client;
                    }
                    return row;
                });
            });
        }
    }, [client, setRows]);

    const submitFunction = api.specific.client.edit;

    const updateClient = submitFunction.useMutation({
        onSuccess: async () => {
            await utils.specific.client.getFull.invalidate();
            await utils.specific.client.getOne.invalidate();
            // await utils.specific.tag.getInfinite.invalidate();
            updateMessage('saved');
        },
        onError: (error) => {
            updateMessage({ content: translate(dictionary, error.message), status: 'error' });
        },
    });

    const onSubmit = (values: z.infer<typeof FormSchema>) => {
        updateMessage('saving');
        updateClient.mutate(values);
    };

    const onRowClick = (key: string | null) => {
        setExpandedRowId(state => state === key ? null : key);
        form.reset(defaultValues);
    };

    // const tags = useTags({
    //     tagsLocal: form.getValues().tags,
    //     setTagsLocal: (tags: string[]) => {
    //         console.log(tags);
    //         form.setValue('tags', tags, { shouldDirty: true });
    //         void form.trigger();
    //     },
    // });

    const chooseDeliveryRoute = (item: { id: string, name: string }) => {
        form.setValue('deliveryRoute', item, { shouldDirty: true });
        void form.trigger();
    }

    useEffect(() => {
        resetMessage();
    }, [expandedRowId]);

    return {
        onRowClick,
        expandedRowId,
        client,
        updateClient,
        form,
        onSubmit: form.handleSubmit(onSubmit, (errors) => {
            console.error('Form validation errors:', errors);
        }),
        isFetching: fullClientFetching,
        // tags,
        chooseDeliveryRoute
    };
};

export default useClientRow;