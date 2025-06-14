import MainModal from '@root/app/_components/Modals/MainModal';
import { Form, FormField } from '@root/app/_components/ui/form';
import Buttons from '@root/app/_components/ui/form/Buttons';
import FormSection from '@root/app/_components/ui/form/Section';
import AuthInput from '@root/app/_components/ui/Inputs/AuthInput';
import InputsWrapper from '@root/app/_components/ui/Inputs/InputsWrapper';
import InputStandard from '@root/app/_components/ui/Inputs/Standard';
import translate from '@root/app/lib/lang/translate';
import { useConsumerDietsTableContext } from '@root/app/specific/components/FoodMenu/ConsumerDiets/context';
import useConsumerFood from '@root/app/specific/components/FoodMenu/ConsumerDiets/ExpandedRow/FoodReplacementEditor/useConsumerFood';
import FoodDropdown from '@root/app/specific/components/ui/Dropdown/Food';
import SelectedDisplay from '@root/app/specific/components/ui/Dropdown/SelectedDisplay';
import Info from '@root/app/specific/components/FoodMenu/ConsumerDiets/ExpandedRow/FoodReplacementEditor/Info';
import ExclusionDropdown from '@root/app/specific/components/ui/Dropdown/Exclusion';
import { type ClientFoodAssignment } from '@root/types/specific';

interface FoodReplacementEditorProps {
    isOpen: boolean;
    onClose: () => void;
    assignment: ClientFoodAssignment;
    // consumer: {
    //     id: string;
    //     name: string;
    //     allergens: { id: string; name: string }[];
    // };
    // food: {
    //     id: string;
    //     name: string;
    //     allergens: { id: string; name: string }[];
    //     ingredients: string | null;
    // };
    // mealId: string;
    // exclusions: { id: string, name: string, allergens: { id: string, name: string }[] }[];
}

const FoodReplacementEditor = ({ assignment, isOpen, onClose }: FoodReplacementEditorProps) => {
    const { dictionary } = useConsumerDietsTableContext();
    const { meal, consumer, food, mealId, exclusions } = assignment;

    const { form, onSubmit, isSubmitting, commonAllergens, updateFood, updateExclusions, allExcludedAllergen } = useConsumerFood(assignment);

    const commonAllergenIds = commonAllergens.map((a) => a.id);

    // Find meal name by mealId


    return (
        <MainModal
            isOpen={isOpen}
            closeModal={onClose}
            header={translate(dictionary, 'menu-creator:food_replacement_editor')}
            allowOverflow
        >
            <div className='relative flex flex-col gap-4 w-full mx-auto p-4'>
                <Info
                    mealName={meal.name}
                    consumerName={consumer.name ?? ''}
                    foodName={form.watch('food')?.name ?? ''}
                    exclusions={form.watch('exclusions')?.map(e => e.name) ?? []}
                />
                <div className='flex flex-col gap-2'>
                    <SelectedDisplay
                        label={translate(dictionary, 'menu-creator:consumer_allergens')}
                        selectedItems={consumer.allergens.map(a => ({ id: a.allergen.id, name: a.allergen.name }))}
                        highlightedItems={commonAllergenIds}
                    />
                    <SelectedDisplay
                        label={translate(dictionary, 'menu-creator:food_allergens')}
                        selectedItems={form.watch('food')?.allergens ?? []}
                        highlightedItems={commonAllergenIds}
                        crossedItems={allExcludedAllergen.map(a => a.id)}
                    />
                    {allExcludedAllergen.length > 0 && <SelectedDisplay
                        label={translate(dictionary, 'menu-creator:exclusions_allergens')}
                        selectedItems={allExcludedAllergen}
                    />}
                </div>
                <Form {...form} >
                    <FormSection>
                        <InputsWrapper >
                            {/* <AuthInput
                                message={translate(dictionary, form.formState.errors.food?.message)}
                                label={translate(dictionary, 'menu-creator:food_label')}
                                horizontal
                            >
                                <FoodDropdown
                                    dictionary={dictionary}
                                    selectedItems={form.watch('food') ? [form.watch('food')] : []}
                                    onItemsChange={updateFood}
                                    placeholder={translate(dictionary, 'menu-creator:food_placeholder')}
                                    excludeAllergens={consumer.allergens.map(a => a.id)}
                                    inputClassName='w-full'
                                    limitItems={1}
                                    showSelectionIcon
                                />
                            </AuthInput> */}
                            <AuthInput
                                message={translate(dictionary, form.formState.errors.exclusions?.message)}
                                label={translate(dictionary, 'menu-creator:exclusions_label')}
                                horizontal
                            >
                                <ExclusionDropdown
                                    dictionary={dictionary}
                                    selectedItems={form.watch('exclusions') ?? []}
                                    onItemsChange={updateExclusions}
                                    placeholder={translate(dictionary, 'menu-creator:exclusions_placeholder')}
                                    withAllergens={form.watch('food')?.allergens.map(a => a.id)}
                                    inputClassName='w-full'
                                    // limitItems={1}
                                    showSelectionIcon
                                />
                            </AuthInput>
                        </InputsWrapper>
                        {/* <InputsWrapper>
                            <FormField
                                control={form.control}
                                name={'comment'}
                                render={({
                                    field,
                                }) => {
                                    return (
                                        <AuthInput
                                            message={translate(dictionary, form.formState.errors.comment?.message)}
                                            label={translate(dictionary, 'menu-creator:comment_label')}
                                            horizontal
                                        >
                                            <InputStandard
                                                type='text'
                                                {...field}
                                                id={'comment'}
                                            />
                                        </AuthInput>
                                    )
                                }}
                            />
                        </InputsWrapper> */}
                    </FormSection>

                    <div className="flex items-center justify-between pt-4">
                        <div>
                            {commonAllergens.length > 0 ? (
                                <i className="fa-solid fa-triangle-exclamation text-2xl text-red-500 dark:text-red-400" />
                            ) : (
                                <i className="fa-solid fa-badge-check text-2xl text-green-500 dark:text-green-400" />
                            )}
                        </div>
                        <Buttons
                            cancelLabel={translate(dictionary, 'shared:cancel')}
                            onCancel={onClose}
                            cancelDisabled={false}
                            submitLabel={translate(dictionary, 'shared:save')}
                            onSubmit={onSubmit}
                            submitDisabled={isSubmitting || !form.formState.isValid}
                            submitLoading={isSubmitting}
                            onReset={form.formState.isDirty ? () => form.reset() : undefined}
                        />
                    </div>
                </Form>
            </div>
        </MainModal>
    );
};

export default FoodReplacementEditor; 