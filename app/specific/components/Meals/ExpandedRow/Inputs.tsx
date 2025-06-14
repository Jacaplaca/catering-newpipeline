import { type z } from 'zod';
import getInputsBulk from '@root/app/lib/table/getInputsBulk';
import InputsWrapper from '@root/app/_components/ui/Inputs/InputsWrapper';
import FormSection from '@root/app/_components/ui/form/Section';
import { useMealTableContext } from '@root/app/specific/components/Meals/context';
import useMealInputs from '@root/app/specific/components/Meals/ExpandedRow/useInputs';
import { type mealEditValidator } from '@root/app/validators/specific/meal';

const MealInputs = () => {

    const {
        dictionary,
        rowClick: { form, isFetching, update }
    } = useMealTableContext();

    const inputs = useMealInputs();

    const Inputs = getInputsBulk<keyof z.infer<typeof mealEditValidator>>({
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
                    {/* {Inputs[1]} */}
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

export default MealInputs;