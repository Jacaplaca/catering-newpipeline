import { Alert } from 'react-daisyui';

export type MessageStatusType = "info" | "success" | "warning" | "error";

const Message: React.FC<{
    show?: boolean,
    message?: string | null | React.ReactNode,
    status?: MessageStatusType
    loading?: boolean,
    className?: string
    onClose?: () => void
    animate?: 'slideInRight' | 'slideInLeft' | 'slideInTop' | 'slideInBottom'
    textSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}> = ({ show, message, status = 'info', loading = false, className = "", onClose, animate, textSize = 'sm' }) => {

    if (!show || !message) return null;

    const mainAnimateClass = 'transform transition-all duration-300 ease-in-out';

    const animateClass = {
        slideInRight: 'animate-slideInRight',
        slideInLeft: 'animate-slideInLeft',
        slideInTop: 'animate-slideInTop',
        slideInBottom: 'animate-slideInBottom',
    }

    const textClass = {
        xs: 'text-xs',
        sm: 'text-sm',
        md: 'text-md',
        lg: 'text-lg',
        xl: 'text-xl',
        '2xl': 'text-2xl',
    }

    const data = {
        info: {
            icon: 'fas fa-info-circle text-info dark:text-darkmode-info',
        },
        spinner: {
            icon: 'fas fa-spinner animate-spin',
        },
        success: {
            icon: 'fas fa-check-circle text-success dark:text-darkmode-success',
        },
        warning: {
            icon: 'fas fa-exclamation-triangle text-warning dark:text-darkmode-warning',
        },
        error: {
            icon: 'fas fa-exclamation-triangle text-alarm dark:text-darkmode-alarm',
        }
    }

    // return (
    //     <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
    //         <div className="pointer-events-auto" onClick={onClose}>
    //             lsdkfjgldkfgj
    //         </div>
    //     </div>
    // );

    //     import { createPortal } from 'react-dom';
    // import { type FunctionComponent, useEffect, useState } from 'react';
    // import Message, { type MessageStatusType } from '@root/app/_components/ui/form/Message';

    // const TableToast: FunctionComponent<{
    //     message?: { content: string, status: MessageStatusType, spinner?: boolean } | null,
    //     onClose: () => void
    // }> = ({ message, onClose }) => {
    //     // Check if we are running in a browser environment
    //     const [isBrowser, setIsBrowser] = useState(false);

    //     useEffect(() => {
    //         // Mark as true once mounted on client side
    //         setIsBrowser(true);
    //     }, []);

    //     if (!isBrowser) {
    //         return null;
    //     }

    //     return createPortal(
    //         <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-50">
    //             <div className="pointer-events-auto" onClick={onClose}>
    //                 lsdkfjgldkfgj
    //             </div>
    //         </div>,
    //         document.body
    //     );
    // }

    // export default TableToast;


    return <Alert
        status={status}
        className={`flex items-center justify-between gap-4 p-4 px-6 rounded-lg
            dark:bg-neutral-900 bg-neutral-50 text-text dark:text-darkmode-text 
            border-border dark:border-darkmode-border shadow-small dark:shadow-darkmode-small ${className}
        ${animate ? `${animateClass[animate]} ${mainAnimateClass}` : ""}
        ${onClose ? 'cursor-pointer' : ""}
        `}
        icon={message ? <i className={`${data[loading ? 'spinner' : status].icon} `}></i> : null}
        onClick={onClose}
    >
        <div
            className={`font-semibold w-full ${textClass[textSize]}`}
        >{message}</div>
        {onClose && <div className={`${textClass[textSize]}`}>
            <i className={`fas fa-xmark opacity-50 hover:opacity-100`}></i>
        </div>}
    </Alert>
};

export default Message;