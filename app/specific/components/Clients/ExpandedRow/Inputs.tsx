import { useClientTableContext } from '@root/app/specific/components/Clients/context';
import { type clientEditValidator } from '@root/app/validators/specific/client';
import { type z } from 'zod';
import getInputsBulk from '@root/app/lib/table/getInputsBulk';
import useClientInputs from '@root/app/specific/components/Clients/ExpandedRow/useInputs';
import translate from '@root/app/lib/lang/translate';
import FormSection from '@root/app/_components/ui/form/Section';
import InputsWrapper from '@root/app/_components/ui/Inputs/InputsWrapper';
import DeliveryRouteDropdown from '@root/app/specific/components/ui/Dropdown/DeliveryRoute';
import FoodCategoryDropdown from '@root/app/specific/components/ui/Dropdown/FoodCategory';
import { FormField } from '@root/app/_components/ui/form';
import AuthInput from '@root/app/_components/ui/Inputs/AuthInput';

const ClientInputs = () => {

    const {
        dictionary,
        rowClick: { form, isFetching, updateClient, client, chooseDeliveryRoute },
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
                            // <AuthInput
                            //     message={translate(dictionary, form.formState.errors.deliveryRoute?.message)}
                            //     label={translate(dictionary, 'consumers:client.name_column')}
                            //     horizontal
                            // >
                            <DeliveryRouteDropdown
                                dictionary={dictionary}
                                onSelect={(deliveryRoute) => {
                                    // if (deliveryRoute) {
                                    form.setValue('deliveryRoute', deliveryRoute, { shouldValidate: true, shouldDirty: true });
                                    void form.trigger();
                                    // }
                                }}
                                selected={value}
                            // inputClassName='w-full'
                            // foundLimitChars={35}
                            />
                            // </AuthInput>
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

            </InputsWrapper>
        </FormSection>
    );
};

export default ClientInputs;