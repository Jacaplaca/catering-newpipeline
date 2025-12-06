"use client"
import { Checkbox as FlowbiteCheckbox, Label as FlowbiteLabel } from "flowbite-react";

type Props = {
    checked: boolean;
    id: string;
    onChange: () => void;
    label?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    name?: string;
    skeleton?: boolean;
    labelStyle?: string;
    inputRef?: React.RefObject<HTMLInputElement>;
    disabled?: boolean;
};

const Checkbox: React.FC<Props> = ({
    checked,
    id,
    onChange,
    label,
    className = '',
    size = 'md',
    name,
    skeleton,
    labelStyle,
    inputRef,
    disabled
}) => {

    const sizes = {
        sm: 'h-4 w-4 text-[29px]',
        md: 'h-5 w-5 text-[35px]',
        lg: 'h-6 w-6 text-[45px]'
    }

    const customTheme = {
        base: `${sizes[size]} rounded border ${checked ? "" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"}`,
        color: {
            default: `
            bg-input
            dark:bg-darkmode-input
            border-checkbox-border
            dark:border-darkmode-checkbox-border

            checked:bg-checkbox-checked
            checked:focus:bg-checkbox-checked
            hover:checked:bg-checkbox-checked

            dark:checked:bg-darkmode-checkbox-checked
            `,
        }
    };

    return (
        <div
            className={`flex items-center cursor-pointer gap-2
            ${skeleton ? "max-w-sm animate-pulse cursor-not-allowed disabled" : null}
            ${className}
            `}
            onClick={e => {
                // console.log("container clicked");
                e.stopPropagation();
                onChange();
            }}
        >
            <FlowbiteCheckbox
                id={id}
                className={`outline-none cursor-pointer ${disabled ? "cursor-not-allowed" : ""}`}
                checked={checked}
                onChange={onChange}
                theme={customTheme}
                name={name}
                ref={inputRef}
                disabled={disabled}
            />
            {label && <FlowbiteLabel>
                <div className={`pl-[5px] label cursor-pointer ${labelStyle ?? ''}`}>
                    {label}
                </div>
            </FlowbiteLabel>}
        </div>
    )
};

export default Checkbox;