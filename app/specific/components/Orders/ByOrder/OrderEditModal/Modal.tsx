import MainModal from '@root/app/_components/Modals/MainModal';
import translate from '@root/app/lib/lang/translate';
import { useOrderTableContext } from '@root/app/specific/components/Orders/ByOrder/context';
import OrderEditor from '@root/app/specific/components/Orders/ByOrder/Order';
import OrderEditorButtons from '@root/app/specific/components/Orders/ByOrder/Order/EditorButtons';
import { type FC } from 'react';

type OrderEditModalProps = {
    isOpen: boolean;
    closeModal: () => void;
}



const OrderEditModal: FC<OrderEditModalProps> = ({ isOpen, closeModal }) => {

    const { dictionary,
        order: { error,
            consumerPicker: {
                open: consumersPickerOpen,
                close: closeConsumersPicker
            },
            day,
            deadlines
        },
        roles: {
            isManager,
        }
    } = useOrderTableContext();

    const headerDate = day ? `${day?.year}-${(day?.month + 1).toString().padStart(2, '0')}-${day?.day.toString().padStart(2, '0')}` : ""

    return <MainModal
        // width={750}
        isOpen={isOpen}
        closeModal={consumersPickerOpen ? undefined : closeModal}
        closeTooltip={consumersPickerOpen
            ? translate(dictionary, 'orders:back_to_order_button')
            : translate(dictionary, 'orders:no_save_warning')}
        header={translate(dictionary, 'orders:edit_order_button') + ' ' + headerDate}
        message={error ? translate(dictionary, error) : undefined}
        customCloseIcon={consumersPickerOpen ? <i className="fas fa-backward mx-1 text-xl" /> : undefined}
        customCloseAction={consumersPickerOpen ? closeConsumersPicker : undefined}
        disallowBackdropClose
        isError={true}
        footer={
            (deadlines.canChange || isManager) && !consumersPickerOpen ? <OrderEditorButtons /> : null
        }
        footerColor={`border-t dark:border-darkmode-modal-separator border-modal-separator
        bg-neutral-200 dark:bg-neutral-700`}
    >
        <OrderEditor />
    </MainModal>
}

export default OrderEditModal;