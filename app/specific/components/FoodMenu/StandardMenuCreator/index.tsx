import ConfirmationModal from '@root/app/_components/Modals/Confirmation';
import Buttons from '@root/app/_components/ui/form/Buttons';
import translate from '@root/app/lib/lang/translate';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
import Meal from '@root/app/specific/components/FoodMenu/StandardMenuCreator/Meal';
import { useState, type FC } from 'react';

const StandardMenuCreator: FC<{ clientId?: string | null }> = ({ clientId }) => {
    const { dictionary, standardMenuForm, isFormNotEmpty, meals } = useFoodMenuContext();
    const { onSubmit, isSubmitting, clearForm, backToDefault, isEditing } = standardMenuForm;
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

    const hide = () => setIsConfirmationOpen(false);
    const action = () => {
        void onSubmit(clientId ?? undefined)();
    }

    const handleSubmit = () => {
        if (isEditing) {
            setIsConfirmationOpen(true);
        } else {
            void onSubmit(clientId ?? undefined)();
        }
    }

    const isFormDirty = standardMenuForm.form.formState.isDirty;
    const disabledForm = !isFormNotEmpty || !isFormDirty;

    return (
        <div className='flex flex-col gap-4'>
            <ConfirmationModal
                question={translate(dictionary, "menu-creator:edit_standard_menu_confirmation")}
                isModalOpen={isConfirmationOpen}
                hide={hide}
                confirmAction={() => action()}
                dictionary={dictionary}
            />
            {meals?.map(({ name, id }) => (
                <Meal key={id} name={name} id={id} />
            ))}
            <Buttons
                cancelLabel={translate(dictionary, 'shared:cancel')}
                onCancel={clearForm}
                cancelDisabled={false}
                submitLabel={translate(dictionary, 'shared:save')}
                onSubmit={handleSubmit}
                // submitDisabled={update.isPending || !form.formState.isValid}
                submitDisabled={disabledForm}
                submitLoading={isSubmitting}
                onReset={backToDefault}
                className='mt-6 w-full flex justify-center'
            />
        </div>
    )
}

export default StandardMenuCreator;
