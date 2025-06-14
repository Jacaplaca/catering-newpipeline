import MyButton from '@root/app/_components/ui/buttons/MyButton';
import Buttons from '@root/app/_components/ui/form/Buttons';
import Tooltip from '@root/app/_components/ui/Tooltip';
import translate from '@root/app/lib/lang/translate';
import ConsumerDiets from '@root/app/specific/components/FoodMenu/ConsumerDiets';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
import FoodMenuDate from '@root/app/specific/components/FoodMenu/Date';
import Meal from '@root/app/specific/components/FoodMenu/StandardMenuCreator/Meal';
import RegularMenuDropdown from '@root/app/specific/components/ui/Dropdown/RegularMenu';
import { useEffect, useState } from 'react';
const StandardMenuCreator = () => {
    const { day, dictionary, standardMenuForm, menuQueries, templateDayObject, lang, pageName, settings, isFormNotEmpty, meals } = useFoodMenuContext();
    const { onSubmit, isLoading, isSubmitting, clearForm, backToDefault, chooseTemplateDay } = standardMenuForm;
    const { templateDayMenuFetching } = menuQueries;

    const [showMenuForConsumers, setShowMenuForConsumers] = useState(false);

    const handleShowMenuForConsumers = () => {
        setShowMenuForConsumers(!showMenuForConsumers);
    }

    useEffect(() => {
        setShowMenuForConsumers(false);
    }, [day.day]);

    const isFormDirty = standardMenuForm.form.formState.isDirty;
    const canEditIndividually = isFormNotEmpty && !isFormDirty;
    const disabledForm = !isFormNotEmpty || !isFormDirty;

    return (
        <div>
            {/* <div className='flex flex-col gap-2'>
                <div>{`isFormDirty: ${JSON.stringify(isFormDirty)}`}</div>
                <div>{`existingMenu: ${JSON.stringify(existingMenu)}`}</div>
                <div>{`isMenuEdited: ${isMenuEdited}`}</div>
                <div>{`isFormNotEmpty: ${isFormNotEmpty}`}</div>
                <div>{`canEditIndividually: ${canEditIndividually}`}</div>
                <div>{`disabledForm: ${disabledForm}`}</div>
            </div> */}
            <div className='flex justify-center items-center gap-2 mb-10'>
                <h1 className='text-2xl font-bold text-center'>{translate(dictionary,
                    showMenuForConsumers
                        ? 'menu-creator:title-for-consumers'
                        : 'menu-creator:title-standard-menu'
                )}</h1>
                <i className={` ${(isLoading || templateDayMenuFetching) ? 'fas fa-spinner animate-spin' : 'fas fa-book-open'}`} />
            </div>
            <div className='flex justify-between items-center gap-2 mt-4 mb-4'>
                {showMenuForConsumers ? <div></div> : <FoodMenuDate />}
                {showMenuForConsumers ? null : <div className='max-w-[300px]'>
                    <RegularMenuDropdown
                        dictionary={dictionary}
                        onSelect={chooseTemplateDay}
                        selected={templateDayObject}
                    />
                </div>}
                <Tooltip content={!canEditIndividually
                    ? translate(dictionary, 'menu-creator:menu-for-consumers-button-tooltip')
                    : ''} >
                    <MyButton
                        type='button'
                        onClick={handleShowMenuForConsumers}
                        id='menu-for-consumers'
                        ariaLabel={'menu-for-consumers'}
                        // loading={submitLoading}
                        disabled={!canEditIndividually}
                    >
                        {translate(dictionary, showMenuForConsumers
                            ? 'menu-creator:menu-standard-button'
                            : 'menu-creator:menu-for-consumers-button'
                        )
                        }
                    </MyButton>
                </Tooltip>
            </div>
            {showMenuForConsumers ?
                <ConsumerDiets
                    lang={lang}
                    pageName={pageName}
                    dictionary={dictionary}
                    settings={settings}
                />
                : <div className='flex flex-col gap-4'>
                    {meals?.map(({ name, id }) => (
                        <Meal key={id} name={name} id={id} />
                    ))}
                    <Buttons
                        cancelLabel={translate(dictionary, 'shared:cancel')}
                        onCancel={clearForm}
                        cancelDisabled={false}
                        submitLabel={translate(dictionary, 'shared:save')}
                        onSubmit={onSubmit}
                        // submitDisabled={update.isPending || !form.formState.isValid}
                        submitDisabled={disabledForm}
                        submitLoading={isSubmitting}
                        onReset={backToDefault}
                        className='mt-6 w-full flex justify-center'
                    />
                </div>}
        </div>
    )
}

export default StandardMenuCreator;
