import { type z } from 'zod';
import getInputsBulk from '@root/app/lib/table/getInputsBulk';
import InputsWrapper from '@root/app/_components/ui/Inputs/InputsWrapper';
import FormSection from '@root/app/_components/ui/form/Section';
import { useMealTableContext } from '@root/app/specific/components/Meals/Main/context';
import useMealInputs from '@root/app/specific/components/Meals/Main/ExpandedRow/useInputs';
import { type mealEditValidator } from '@root/app/validators/specific/meal';
import { FormField } from '@root/app/_components/ui/form';
import AuthInput from '@root/app/_components/ui/Inputs/AuthInput';
import translate from '@root/app/lib/lang/translate';
import MealGroupDropdown from '@root/app/specific/components/ui/Dropdown/MealGroup';

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
            >
                <InputsWrapper >
                    {Inputs[0]}
                    {Inputs[1]}
                </InputsWrapper>
                <InputsWrapper >
                    {/* <FormField
                        control={form.control}
                        name={'mealCategory'}
                        render={({
                            field: { value },
                        }) => {
                            return (
                                <AuthInput
                                    message={translate(dictionary, form.formState.errors.mealCategory?.message)}
                                    label={translate(dictionary, 'meals:category_label')}
                                    horizontal
                                >
                                    <MealCategoryDropdown
                                        dictionary={dictionary}
                                        onSelect={(mealCategory) => {
                                            if (mealCategory) {
                                                form.setValue('mealCategory', mealCategory, { shouldValidate: true, shouldDirty: true });
                                            }
                                        }}
                                        selectedItem={value}
                                        inputClassName='w-full'
                                        foundLimitChars={35}
                                    />
                                </AuthInput>
                            )
                        }}
                    /> */}
                    <FormField
                        control={form.control}
                        name={'mealGroup'}
                        render={({
                            field: { value },
                        }) => {
                            return (
                                <AuthInput
                                    message={translate(dictionary, form.formState.errors.mealCategory?.message)}
                                    label={translate(dictionary, 'meals:group_label')}
                                    horizontal
                                >
                                    <MealGroupDropdown
                                        dictionary={dictionary}
                                        onSelect={(mealGroup) => {
                                            if (mealGroup) {
                                                form.setValue('mealGroup', mealGroup, { shouldValidate: true, shouldDirty: true });
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

            </FormSection>
        </div>
    );
};

export default MealInputs;