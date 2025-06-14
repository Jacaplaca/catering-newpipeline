import { type z } from 'zod';
import getInputsBulk from '@root/app/lib/table/getInputsBulk';
import InputsWrapper from '@root/app/_components/ui/Inputs/InputsWrapper';
import FormSection from '@root/app/_components/ui/form/Section';
import useFoodInputs from '@root/app/specific/components/Food/Main/ExpandedRow/useInputs';
import { type foodEditValidator } from '@root/app/validators/specific/food';
import { useFoodTableContext } from '@root/app/specific/components/Food/Main/context';
import AuthInput from '@root/app/_components/ui/Inputs/AuthInput';
import { FormField } from '@root/app/_components/ui/form';
import translate from '@root/app/lib/lang/translate';
import FoodCategoryDropdown from '@root/app/specific/components/ui/Dropdown/FoodCategory';
import AllergenDropdown from '@root/app/specific/components/ui/Dropdown/Allergen';
const FoodInputs = () => {

    const {
        dictionary,
        rowClick: { form, isFetching, update }
    } = useFoodTableContext();

    const inputs = useFoodInputs();

    const Inputs = getInputsBulk<keyof z.infer<typeof foodEditValidator>>({
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

                <InputsWrapper >
                    <FormField
                        control={form.control}
                        name={'foodCategory'}
                        render={({
                            field: { value },
                        }) => {
                            return (
                                <AuthInput
                                    message={translate(dictionary, form.formState.errors.foodCategory?.message)}
                                    label={translate(dictionary, 'food:category_label')}
                                    horizontal
                                >
                                    <FoodCategoryDropdown
                                        dictionary={dictionary}
                                        onSelect={(foodCategory) => {
                                            if (foodCategory) {
                                                form.setValue('foodCategory', foodCategory, { shouldValidate: true, shouldDirty: true });
                                            }
                                        }}
                                        selectedItem={value}
                                        inputClassName='w-full'
                                        foundLimitChars={35}
                                    />
                                </AuthInput>
                            )
                        }}
                    />
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
                                    label={translate(dictionary, 'food:allergens_label')}
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
                                        placeholder={translate(dictionary, 'food:allergens_placeholder')}
                                        selectedLabel={translate(dictionary, 'food:selected_allergens')}
                                    />
                                </AuthInput>
                            )
                        }}
                    />
                </InputsWrapper>
                <InputsWrapper>
                    {Inputs[1]}
                </InputsWrapper>

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

export default FoodInputs;