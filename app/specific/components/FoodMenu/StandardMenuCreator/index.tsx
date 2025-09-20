import ConfirmationModal from '@root/app/_components/Modals/Confirmation';
import translate from '@root/app/lib/lang/translate';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
import Meal from '@root/app/specific/components/FoodMenu/StandardMenuCreator/Meal';
import ActionButtons from '@root/app/specific/components/FoodMenu/StandardMenuCreator/ActionButtons';
import { useState, useEffect, useRef, type FC } from 'react';

const StandardMenuCreator: FC<{ clientId?: string | null }> = ({ clientId }) => {
    const { dictionary, standardMenuForm, isFormNotEmpty, meals } = useFoodMenuContext();
    const { onSubmit, isSubmitting, clearForm, backToDefault, isEditing } = standardMenuForm;
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [isSticky, setIsSticky] = useState(true);
    const originalButtonsRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        if (!originalButtonsRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry) {
                    // Sticky jest widoczny gdy oryginalny kontener NIE jest widoczny
                    // Sticky znika gdy oryginalny kontener STAJE SIĘ widoczny
                    setIsSticky(!entry.isIntersecting);
                }
            },
            {
                threshold: 0,
                rootMargin: '0px'
            }
        );

        observer.observe(originalButtonsRef.current);

        return () => {
            observer.disconnect();
        };
    }, []);

    const isFormDirty = standardMenuForm.form.formState.isDirty;
    const disabledForm = !isFormNotEmpty || !isFormDirty;

    return (
        <div className='flex flex-col gap-4 '>
            <ConfirmationModal
                question={translate(dictionary, "menu-creator:edit_standard_menu_confirmation")}
                isModalOpen={isConfirmationOpen}
                hide={hide}
                confirmAction={() => action()}
                dictionary={dictionary}
            />



            <div>
                {meals?.map(({ name, id }) => (
                    <Meal key={id} name={name} id={id} />
                ))}
            </div>

            {/* Oryginalny kontener z przyciskami - punkt odniesienia dla intersection observer */}
            <div ref={originalButtonsRef}>
                <ActionButtons
                    dictionary={dictionary}
                    onCancel={clearForm}
                    onSubmit={handleSubmit}
                    onReset={backToDefault}
                    submitDisabled={disabledForm}
                    submitLoading={isSubmitting}
                    isSticky={false}
                />
            </div>

            {/* Sticky kontener z przyciskami - pokazuje się jako bubble po prawej gdy oryginalny na dole nie jest widoczny */}
            {isSticky && (
                <ActionButtons
                    dictionary={dictionary}
                    onCancel={clearForm}
                    onSubmit={handleSubmit}
                    onReset={backToDefault}
                    submitDisabled={disabledForm}
                    submitLoading={isSubmitting}
                    isSticky={true}
                />
            )}
        </div>
    )
}

export default StandardMenuCreator;
