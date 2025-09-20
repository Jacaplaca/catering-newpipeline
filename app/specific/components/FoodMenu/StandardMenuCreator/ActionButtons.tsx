import Buttons from '@root/app/_components/ui/form/Buttons';
import translate from '@root/app/lib/lang/translate';
import { type FC } from 'react';

interface ActionButtonsProps {
    dictionary: Record<string, string>;
    onCancel: () => void;
    onSubmit: () => void;
    onReset: () => void;
    submitDisabled: boolean;
    submitLoading: boolean;
    isSticky?: boolean;
}

const ActionButtons: FC<ActionButtonsProps> = ({
    dictionary,
    onCancel,
    onSubmit,
    onReset,
    submitDisabled,
    submitLoading,
    isSticky = false
}) => {
    const baseClasses = 'pb-4';
    const stickyClasses = 'fixed top-12 right-4 z-50 bg-white dark:bg-darkmode-modal-background rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-4 py-2 max-w-xs';
    const originalClasses = '';

    return (
        <div className={`${baseClasses} ${isSticky ? stickyClasses : originalClasses}`}>
            <Buttons
                cancelLabel={translate(dictionary, 'shared:cancel')}
                onCancel={onCancel}
                cancelDisabled={false}
                submitLabel={translate(dictionary, 'shared:save')}
                onSubmit={onSubmit}
                submitDisabled={submitDisabled}
                submitLoading={submitLoading}
                onReset={onReset}
                className={`${isSticky ? 'flex flex-col gap-2' : 'w-full flex justify-center'}`}
            />
        </div>
    );
};

export default ActionButtons;
