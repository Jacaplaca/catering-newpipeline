import InputStandard from '@root/app/_components/ui/Inputs/Standard';
import translate from '@root/app/lib/lang/translate';
import { useOrderTableContext } from '@root/app/specific/components/Orders/ByOrder/context';
import Deadline from '@root/app/specific/components/Orders/ByOrder/Order/Deadline';
import LastOrderInfo from '@root/app/specific/components/Orders/ByOrder/Order/LastOrderInfo';
import OrderMatrix from '@root/app/specific/components/Orders/ByOrder/Order/Matrix';
import OrderDatePicker from '@root/app/specific/components/Orders/ByOrder/Order/OrderDatePicker';
import { useEffect, useState, type FC } from 'react';

const Order: FC = () => {
    const [showNoteInput, setShowNoteInput] = useState(false);

    const {
        dictionary,
        rowClick: {
            orderForEdit,
            expandedRowId
        },
        order: {
            consumerPicker: {
                setOpen: setConsumersPickerOpen,
            },
            lastOrder,
            notes,
            updateNote
        },
        roles: {
            isClient,
        }
    } = useOrderTableContext();

    useEffect(() => {
        setConsumersPickerOpen(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div className="flex flex-col gap-2 sm:gap-4 py-2 sm:py-4">
        {isClient ? <div>{orderForEdit ? <Deadline /> : <OrderDatePicker />}</div> : null}
        <OrderMatrix />
        <button
            type="button"
            onClick={() => setShowNoteInput(!showNoteInput)}
            className="self-start underline cursor-pointer text-sm sm:text-base"
        >
            {showNoteInput
                ? translate(dictionary, 'orders:hide_notes_editor')
                : translate(dictionary, 'orders:show_notes_editor')}
        </button>
        {showNoteInput && (
            <InputStandard
                id={`order-note`}
                type="text"
                isTextArea
                placeholder={translate(dictionary, 'orders:order_input_note')}
                maxLength={1000}
                onChange={(e) => {
                    updateNote(e.target.value);
                }}
                className={`w-full dark:bg-transparent
                        `}
                value={notes}
            />
        )}
        {expandedRowId ? null : lastOrder ? <LastOrderInfo day={lastOrder.day} dictionary={dictionary} /> : null}
    </div>
}

export default Order;