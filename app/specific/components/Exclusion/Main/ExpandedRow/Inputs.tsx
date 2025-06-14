import { type z } from 'zod';
import getInputsBulk from '@root/app/lib/table/getInputsBulk';
import InputsWrapper from '@root/app/_components/ui/Inputs/InputsWrapper';
import FormSection from '@root/app/_components/ui/form/Section';
import useExclusionInputs from '@root/app/specific/components/Exclusion/Main/ExpandedRow/useInputs';
import { type exclusionEditValidator } from '@root/app/validators/specific/exclusion';
import { useExclusionTableContext } from '@root/app/specific/components/Exclusion/Main/context';
import AuthInput from '@root/app/_components/ui/Inputs/AuthInput';
import { FormField } from '@root/app/_components/ui/form';
import translate from '@root/app/lib/lang/translate';
import AllergenDropdown from '@root/app/specific/components/ui/Dropdown/Allergen';
const ExclusionInputs = () => {

    const {
        dictionary,
        rowClick: { form, isFetching, update }
    } = useExclusionTableContext();

    const inputs = useExclusionInputs();

    const Inputs = getInputsBulk<keyof z.infer<typeof exclusionEditValidator>>({
        inputs,
        dictionary,
        formControl: form.control,
        isFetching: isFetching || update.isPending
    });

    return (
        <div className='flex flex-col gap-4'>
            <FormSection>
                <InputsWrapper >
                    {Inputs[0]}
                </InputsWrapper>
                <InputsWrapper>
                    <FormField
                        control={form.control}
                        name={'allergens'}
                        render={({
                            field: { value },
                        }) => {
                            return (
                                <AuthInput
                                    message={translate(dictionary, form.formState.errors.allergens?.message)}
                                    label={translate(dictionary, 'exclusion:allergens_label')}
                                    horizontal
                                >
                                    <AllergenDropdown
                                        dictionary={dictionary}
                                        inputClassName='w-full'
                                        foundLimitChars={35}
                                        selectedItems={value ?? []}
                                        onItemsChange={(items) => {
                                            form.setValue('allergens', items, { shouldValidate: true, shouldDirty: true });
                                        }}
                                        showSelectionIcon
                                        placeholder={translate(dictionary, 'exclusion:allergens_placeholder')}
                                        selectedLabel={translate(dictionary, 'exclusion:selected_allergens')}
                                    />
                                </AuthInput>
                            )
                        }}
                    />
                </InputsWrapper>
            </FormSection>
        </div>
    );
};

export default ExclusionInputs;