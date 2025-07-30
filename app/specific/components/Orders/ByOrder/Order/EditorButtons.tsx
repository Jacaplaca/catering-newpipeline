import { OrderStatus } from '@prisma/client';
import MyButton from '@root/app/_components/ui/buttons/MyButton';
import Buttons from '@root/app/_components/ui/form/Buttons';
import Tooltip from '@root/app/_components/ui/Tooltip';
import translate from '@root/app/lib/lang/translate';
import { useOrderTableContext } from '@root/app/specific/components/Orders/ByOrder/context';
import { type FC } from 'react';

const OrderEditorButtons: FC = () => {
    const {
        dictionary,
        rowClick: {
            orderForEdit
        },
        order: { onSubmitDraft,
            savingDraft,
            reset,
            onSubmitPlace,
            placing,
            deadlines: { isBetween },
        },
        roles: { isManager }
    } = useOrderTableContext();

    //  We agree that we no longer need to save draft
    // const canSaveDraft = orderForEdit?.status !== OrderStatus.in_progress
    //     && orderForEdit?.status !== OrderStatus.completed;
    const canSaveDraft = false;

    const canEditInProgress = orderForEdit?.status === OrderStatus.in_progress;
    const canSaveOrder = orderForEdit?.status !== OrderStatus.completed && orderForEdit?.status !== OrderStatus.in_progress;

    const toLate = orderForEdit?.status === OrderStatus.draft && isBetween;

    if (toLate) {
        return <div />
    }

    return <div className='flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 w-full'>
        {canSaveDraft ? <Tooltip content={translate(dictionary, 'orders:draft_save_tooltip')}>
            <MyButton
                loading={savingDraft}
                className='w-full sm:w-auto bg-transparent dark:bg-transparent'
                icon='fas fa-save'
                ariaLabel={translate(dictionary, 'orders:draft_save_button')}
                onClick={onSubmitDraft}
                id='save-order'
                type='button'
            >
                {translate(dictionary, 'orders:draft_save_button')}
            </MyButton>
        </Tooltip> : <div />}
        {(canEditInProgress || canSaveOrder || isManager) ? <div className='w-full sm:w-auto'>
            <Buttons
                submitLabel={translate(dictionary, canSaveOrder ? 'orders:send_button' : 'orders:edit_order_button')}
                onSubmit={onSubmitPlace}
                submitLoading={placing}
                cancelLabel={translate(dictionary, 'shared:reset')}
                onCancel={reset}
                className='w-full sm:w-auto'
            />
        </div> : null}
    </div>
}

export default OrderEditorButtons;