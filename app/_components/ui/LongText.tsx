import { type FunctionComponent } from 'react';

const LongText: FunctionComponent<{
    text: string,
    label?: string,
    ActionButton: FunctionComponent,
    className?: string
    horizontal?: boolean
    labelWidth?: string
}> = ({ text, label, ActionButton, className = "", horizontal, labelWidth = '170px' }) => {

    return (
        <div className={`long-text ${className}`}>
            <div
                className={`
                    ${horizontal ? 'flex flex-col md:grid md:gap-4 md:items-center' : 'flex flex-col'}
                    ${horizontal ? `md:grid-cols-[${labelWidth}_1fr]` : ''}
                `}
                style={horizontal ? { gridTemplateColumns: `${labelWidth} 1fr` } : undefined}
            >
                {label && (
                    <div className={`min-w-0 ${!horizontal ? 'mb-2' : ''}`}>
                        <p className='text-neutral-600 dark:text-neutral-300'>{label}</p>
                    </div>
                )}
                <div className="min-w-0">
                    <div className={`inline-flex items-start p-3 rounded-md gap-3 bg-white dark:bg-darkmode-input border-input-border dark:border-darkmode-input-border border-[1px] ${horizontal ? 'w-full' : 'max-w-fit'}`}>
                        <div className="pb-2 break-all text-sm text-neutral-800 dark:text-neutral-100">
                            {text}
                        </div>
                        <div className="flex-shrink-0">
                            <ActionButton />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default LongText;