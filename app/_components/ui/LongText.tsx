import { type FunctionComponent } from 'react';

const LongText: FunctionComponent<{
    text: string,
    label?: string,
    ActionButton: FunctionComponent,
    className?: string
}> = ({ text, label, ActionButton, className = "" }) => {

    return (
        <div className={`long-text ${className} inline-block max-w-fit`}>
            {label && <p className='mb-2 text-neutral-600 dark:text-neutral-300'>{label}</p>}
            <div className={`inline-flex items-start p-3 rounded-md gap-3 bg-white dark:bg-darkmode-input border-input-border dark:border-darkmode-input-border border-[1px]`}>
                <div className="pb-2 break-all text-sm text-neutral-800 dark:text-neutral-100">
                    {text}
                </div>
                <div className="flex-shrink-0">
                    <ActionButton />
                </div>
            </div>
        </div>
    )
};

export default LongText;