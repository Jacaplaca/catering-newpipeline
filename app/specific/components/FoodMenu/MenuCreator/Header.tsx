import MyButton from '@root/app/_components/ui/buttons/MyButton';
import Tooltip from '@root/app/_components/ui/Tooltip';
import translate from '@root/app/lib/lang/translate';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
import FoodMenuDate from '@root/app/specific/components/FoodMenu/Date';
import RegularMenuDropdown from '@root/app/specific/components/ui/Dropdown/RegularMenu';
import { env } from '@root/app/env';
import DayMenuPdf from '@root/app/specific/components/FoodMenu/ConsumerDiets/DayMenuPdf';
import { format } from 'date-fns-tz';
import ContextMenuForMenuCreator from '@root/app/specific/components/FoodMenu/MenuCreator/ContextMenuForMenuCreator';
import { type FC } from 'react';

const PublishStatus: FC<{ isPublished: boolean }> = ({ isPublished }) => {
    const { dictionary } = useFoodMenuContext();

    return (
        <div className='flex items-center gap-2'>
            {isPublished ? (
                <>
                    <i className='fas fa-check-circle text-green-500' />
                    {translate(dictionary, 'menu-creator:menu_is_published')}
                </>
            ) : (
                <>
                    <i className='fas fa-times-circle text-red-500' />
                    {translate(dictionary, 'menu-creator:menu_in_not_published')}
                </>
            )}
        </div>
    )
}

const MenuCreatorHeader: FC = () => {
    const { day, dictionary, standardMenuForm, menuQueries, templateDayObject, isFormNotEmpty, showMenuForConsumers, handleShowMenuForConsumers } = useFoodMenuContext();
    const { isLoading, chooseTemplateDay } = standardMenuForm;
    const { templateDayMenuFetching } = menuQueries;

    const isFormDirty = standardMenuForm.form.formState.isDirty;
    const canEditIndividually = isFormNotEmpty && !isFormDirty;

    const dayDate = day?.day && new Date(day.day.year, day.day.month, day.day.day);
    const dayDateString = dayDate && format(dayDate, 'yyyy-MM-dd');

    return (<div>
        {
            env.NEXT_PUBLIC_MENU_FRONT && (
                <div>
                    {menuQueries?.existingMenu?.id}
                </div>
            )
        }
        <div className='flex flex-col justify-center items-center mb-10 gap-2'>
            <div className='flex items-center gap-2'>
                <h1 className='text-2xl font-bold text-center'>{translate(dictionary,
                    showMenuForConsumers
                        ? 'menu-creator:title-for-consumers'
                        : 'menu-creator:title-standard-menu'
                )} {dayDateString ? `- ${dayDateString}` : ''}</h1>
                <i className={` ${(isLoading || templateDayMenuFetching) ? 'fas fa-spinner animate-spin' : 'fas fa-book-open'}`} />
            </div>
            <PublishStatus isPublished={!!menuQueries?.existingMenu?.isPublished} />
        </div>
        <div className='flex flex-col md:flex-row md:justify-between items-center gap-4 md:gap-2 mt-4 mb-4'>
            {showMenuForConsumers ? <div className='flex items-center gap-2'>
                <ContextMenuForMenuCreator />
                <DayMenuPdf
                    iconClass='text-[2rem]'
                    tooltipLabel='menu-creator:day-all-clients-menu-pdf'
                /></div> : <div className="w-full md:w-auto"><FoodMenuDate /></div>}
            {showMenuForConsumers ? null : <div className='w-full md:w-auto md:max-w-[300px]'>
                <RegularMenuDropdown
                    dictionary={dictionary}
                    onSelect={chooseTemplateDay}
                    selected={templateDayObject}
                />
            </div>}
            <div className="w-full md:w-auto">
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
                        className="w-full md:w-auto"
                    >
                        {translate(dictionary, showMenuForConsumers
                            ? 'menu-creator:menu-standard-button'
                            : 'menu-creator:menu-for-consumers-button'
                        )
                        }
                    </MyButton>
                </Tooltip>
            </div>
        </div>
    </div>
    )
}

export default MenuCreatorHeader;
