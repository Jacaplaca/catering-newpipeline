import { type z } from 'zod';
import getInputsBulk from '@root/app/lib/table/getInputsBulk';
import InputsWrapper from '@root/app/_components/ui/Inputs/InputsWrapper';
import FormSection from '@root/app/_components/ui/form/Section';
import { type clientCategoryEditValidator } from '@root/app/validators/specific/clientCategory';
import { useClientCategoryTableContext } from '@root/app/specific/components/Clients/Category/context';
import useClientCategoryInputs from '@root/app/specific/components/Clients/Category/ExpandedRow/useInputs';

const ClientCategoryInputs = () => {

    const {
        dictionary,
        rowClick: { form, isFetching, update }
    } = useClientCategoryTableContext();

    const inputs = useClientCategoryInputs();

    const Inputs = getInputsBulk<keyof z.infer<typeof clientCategoryEditValidator>>({
        inputs,
        dictionary,
        formControl: form.control,
        isFetching: isFetching || update.isPending
    });

    return (
        <div className='flex flex-col gap-4'>

            <FormSection
            // title={translate(dictionary, 'consumers:consumer_label')}
            // description={formData?.code?.toString() ?? ''}
            // twoRows={!!expandedRowId}
            >
                <InputsWrapper >
                    {Inputs[0]}
                    {Inputs[1]}
                    {/* {Inputs[2]} */}
                    {/* {!expandedRowId && Inputs[1]} */}
                    {/* {!expandedRowId && Inputs[2]} */}
                </InputsWrapper>
                {/* {!!expandedRowId && <InputsWrapper>
                    {Inputs[1]}
                    {Inputs[2]}
                </InputsWrapper>} */}
            </FormSection>
            {/* <FormSection
                title={translate(dictionary, 'consumers:diet_label')}
            // description={formData?.diet?.code?.toString() ?? ''}
            ><InputsWrapper>
                    {Inputs[2]}
                    {Inputs[3]}
                </InputsWrapper>
            </FormSection> */}
        </div>
    );
};

export default ClientCategoryInputs;