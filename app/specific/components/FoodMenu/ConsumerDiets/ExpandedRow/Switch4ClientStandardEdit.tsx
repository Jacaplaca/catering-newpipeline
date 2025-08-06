import { useConsumerDietsTableContext } from '@root/app/specific/components/FoodMenu/ConsumerDiets/context';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
import translate from '@root/app/lib/lang/translate';
import Switch from '@root/app/_components/Switch';
import MyButton from '@root/app/_components/ui/buttons/MyButton';

const Switch4ClientStandardEdit = () => {
    const { dictionary } = useConsumerDietsTableContext();
    const { isMenuEditableForClient, toggleMenuEditableForClient, isStandardMenuCreatorShown, toggleStandardMenuCreator } = useFoodMenuContext();

    const standardMenuButtonLabel = translate(dictionary, isStandardMenuCreatorShown ? "menu-creator:back-to-consumer-menu" : 'menu-creator:edit-standard-menu');

    return (
        <div className='flex gap-2 items-center justify-between'>
            {isMenuEditableForClient && <div className='flex justify-between items-center gap-2 mt-4 mb-4'>
                <MyButton
                    id="edit-standard-menu"
                    ariaLabel={standardMenuButtonLabel}
                    onClick={toggleStandardMenuCreator}>
                    {standardMenuButtonLabel}
                </MyButton>
            </div>}
            <div className='flex items-center gap-2 mb-4'>
                <div className='text-neutral-600 dark:text-neutral-300'>
                    {translate(dictionary, 'menu-creator:is-menu-editable-for-client')}
                </div>
                <Switch
                    id="is-menu-editable-for-client"
                    checked={isMenuEditableForClient}
                    onClick={toggleMenuEditableForClient}
                    uncheckedIcon="fa-solid fa-minus text-neutral-100 dark:text-white"
                    checkedIcon="fa-solid fa-check text-green-100 dark:text-white"
                    uncheckedColor="bg-red-600 dark:bg-red-500"
                    checkedColor="bg-green-500 dark:bg-green-400"
                    className=""
                />
            </div>
        </div>
    );
}


export default Switch4ClientStandardEdit;