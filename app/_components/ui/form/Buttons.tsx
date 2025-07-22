import MyButton from '@root/app/_components/ui/buttons/MyButton';
import { type FunctionComponent } from 'react';

const Buttons: FunctionComponent<{
    className?: string
    align?: 'left' | 'center' | 'right' // Nowy prop
    cancelLabel?: string
    onCancel?: () => void
    cancelDisabled?: boolean
    submitLabel: string
    onSubmit: () => void
    submitDisabled?: boolean
    submitLoading?: boolean
    onReset?: () => void
}> = ({
    className,
    align = 'right', // Domyślnie do prawej
    cancelLabel,
    onCancel,
    cancelDisabled,
    submitLabel,
    onSubmit,
    submitDisabled,
    submitLoading,
    onReset
}) => {
        const alignClass = {
            left: 'justify-start',
            center: 'justify-center',
            right: 'justify-end'
        }[align];

        return (
            <div className={`flex gap-4 ${alignClass} items-center ${className ?? ""}`}>
                {onReset
                    ? <i
                        onClick={onReset}
                        className="fas fa-undo-alt text-neutral-500 cursor-pointer"></i>
                    : null}
                {cancelLabel ? <MyButton
                    type='reset'
                    onClick={onCancel}
                    id='cancel-settings'
                    ariaLabel={cancelLabel}
                    disabled={cancelDisabled}
                >
                    {cancelLabel}
                </MyButton> : null}
                <MyButton
                    type='submit'
                    onClick={onSubmit}
                    id='save-settings'
                    ariaLabel={submitLabel}
                    loading={submitLoading}
                    disabled={submitDisabled}
                >
                    {submitLabel}
                </MyButton>
            </div>
        )
    }

export default Buttons;