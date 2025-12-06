import SimpleDropdown from '@root/app/_components/ui/SimpleDropdown';
import translate from '@root/app/lib/lang/translate';
import { type TableActionType } from '@root/types';
import { DropdownDivider, DropdownItem } from 'flowbite-react';
import { type FunctionComponent } from 'react';

const RowActions: FunctionComponent<{
    label: string,
    actions: TableActionType[],
    dictionary: Record<string, string>
    disabled?: boolean
}> = ({ label, actions, disabled, dictionary }) => {
    return (
        <SimpleDropdown
            label={
                <>
                    <i className="-ml-1 mr-1.5 mt-1 w-5 fa-solid fa-chevron-down"></i>
                    {label}
                </>
            }
            theme={{ arrowIcon: "hidden" }}
            disabled={disabled}
        >
            {actions.filter(action => !action.hidden).map(({ label, onClick, icon, isDivider, key, iconClassName, disabled }) => {
                if (isDivider) {
                    return <DropdownDivider key={key} />
                }
                return (
                    <DropdownItem
                        key={key}
                        onClick={onClick}
                        disabled={disabled}
                    >
                        <div className={`flex items-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed line-through' : ''}`}>

                            {icon && <i className={`${icon} mr-2 ${iconClassName}`}></i>}
                            {translate(dictionary, label)}
                        </div>
                    </DropdownItem>
                )
            })}
        </SimpleDropdown>
    )
};

export default RowActions;