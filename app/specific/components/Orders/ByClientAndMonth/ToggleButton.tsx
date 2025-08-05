import { type FunctionComponent, type ReactNode } from 'react';

interface ToggleButtonProps {
    onClick: () => void;
    isActive: boolean;
    icon: string;
    children: ReactNode;
    activeStyles?: string;
    inactiveStyles?: string;
}

const ToggleButton: FunctionComponent<ToggleButtonProps> = ({
    onClick,
    isActive,
    icon,
    children,
    activeStyles = 'bg-secondary text-neutral-900 dark:text-white border-secondary shadow-md dark:bg-darkmode-secondary dark:border-darkmode-secondary',
    inactiveStyles = 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'
}) => {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 font-bold rounded-lg border transition-all duration-200 flex items-center gap-2 ${isActive ? activeStyles : inactiveStyles
                }`}
        >
            <i className={icon}></i>
            {children}
        </button>
    );
};

export default ToggleButton;