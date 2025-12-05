import { useClientTableContext } from '@root/app/specific/components/Clients/Main/context';
import { type clientEditValidator } from '@root/app/validators/specific/client';
import { type z } from 'zod';
import getInputsBulk from '@root/app/lib/table/getInputsBulk';
import useClientInputs from '@root/app/specific/components/Clients/Main/ExpandedRow/useInputs';
// import Tags from '@root/app/_components/ui/Inputs/Tags';
import translate from '@root/app/lib/lang/translate';
import FormSection from '@root/app/_components/ui/form/Section';
import InputsWrapper from '@root/app/_components/ui/Inputs/InputsWrapper';

const ClientInputs = () => {

    const {
        dictionary,
        rowClick: { form, isFetching, updateClient, client,
            // tags: { tagsLocal, searchResults, addTag, removeTag, searchTags, isSearching } 
        },
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
            {/* <InputsWrapper> {Inputs.slice(-1)}
                <Tags
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
                />

            </InputsWrapper> */}
        </FormSection>
    );
};

export default ClientInputs;