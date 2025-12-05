import { useClientTableContext } from '@root/app/specific/components/Clients/Main/context';
import { type clientEditValidator } from '@root/app/validators/specific/client';
import { type z } from 'zod';
import getInputsBulk from '@root/app/lib/table/getInputsBulk';
import useClientInputs from '@root/app/specific/components/Clients/Main/ExpandedRow/useInputs';
import translate from '@root/app/lib/lang/translate';
import FormSection from '@root/app/_components/ui/form/Section';
import InputsWrapper from '@root/app/_components/ui/Inputs/InputsWrapper';
import DeliveryRouteDropdown from '@root/app/specific/components/ui/Dropdown/DeliveryRoute';
import { FormField } from '@root/app/_components/ui/form';
import makeHref from '@root/app/lib/url/makeHref';
import LinkCopy from '@root/app/_components/Dashboard/Settings/Invite/LinkCopy';
import ClientCategoryDropdown from '@root/app/specific/components/ui/Dropdown/ClientCategory';

const ClientInputs = () => {

    const {
        dictionary,
        rowClick: { form, isFetching, updateClient, client, expandedRowId },
        lang,
    } = useClientTableContext();

    const inputs = useClientInputs();

    const Inputs = getInputsBulk<keyof z.infer<typeof clientEditValidator>>({
        inputs,
        dictionary,
        formControl: form.control,
        isFetching: isFetching || updateClient.isPending
    });

    return (
        <FormSection
            title={translate(dictionary, 'clients:client_label')}
            description={client?.info?.code ?? ''}
            twoRows>

            <InputsWrapper > {Inputs.slice(0, -1)} </InputsWrapper>
            <InputsWrapper> {Inputs.slice(-1)}

                <FormField
                    control={form.control}
                    name={'deliveryRoute'}
                    render={({
                        field: { value },
                    }) => {
                        return (
                            <DeliveryRouteDropdown
                                dictionary={dictionary}
                                onSelect={(deliveryRoute) => {
                                    form.setValue('deliveryRoute', deliveryRoute, { shouldValidate: true, shouldDirty: true });
                                    void form.trigger();
                                }}
                                selected={value}
                            />
                        )
                    }}
                />

                <FormField
                    control={form.control}
                    name={'clientCategory'}
                    render={({
                        field: { value },
                    }) => {
                        return (
                            <ClientCategoryDropdown
                                dictionary={dictionary}
                                onSelect={(clientCategory) => {
                                    form.setValue('clientCategory', clientCategory, { shouldValidate: true, shouldDirty: true });
                                    void form.trigger();
                                }}
                                selected={value}
                            />
                        )
                    }}
                />

                {/* <DeliveryRouteDropdown
                    dictionary={dictionary}
                    onSelect={chooseDeliveryRoute}
                    selected={client?.deliveryRoute}
                /> */}
                {/* <Tags
                    tags={tagsLocal}
                    handleSearch={searchTags}
                    searchResults={searchResults}
                    add={addTag}
                    remove={removeTag}
                    isSearching={isSearching}
                    labels={
                        {
                            add: translate(dictionary, 'shared:add'),
                            placeholder: translate(dictionary, 'shared:add_tag'),
                            title: translate(dictionary, 'shared:tags')
                        }
                    }
                /> */}
                <LinkCopy
                    label={translate(dictionary, 'clients:menu_link')}
                    link={makeHref({ lang, page: 'menu', slugs: [expandedRowId ?? ''] }, true)}
                />
            </InputsWrapper>
        </FormSection>
    );
};

export default ClientInputs;