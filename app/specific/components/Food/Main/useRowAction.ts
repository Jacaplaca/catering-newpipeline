import useTableCheckbox from '@root/app/hooks/table/useTableCheckbox';
import useRemoveFood from '@root/app/specific/components/Food/Main/actions/useRemove';
import { type TableActionType } from '@root/types';
import { useState } from 'react';

const useFoodAction = ({
    rows,
    onSuccess,
}: {
    rows: string[],
    onSuccess: () => unknown,
}) => {
    const { idsChecked, toggleCheck, checkAllOnPage, uncheckAll, isAllChecked } = useTableCheckbox(rows);

    const [activeAction, setActiveAction] = useState<'remove' | null>(null);

    const remove = useRemoveFood({ onSuccess, ids: idsChecked })

    const showConfirmation = (type: 'remove') => {
        switch (type) {
            case 'remove':
                remove.show();
                setActiveAction('remove');
                break;
            default:
                break;
        }
    }

    const getConfirmationData = () => {
        switch (activeAction) {
            case 'remove':
                return remove;
            default:
                return {
                    questionKey: '',
                    isConfirmationOpen: false,
                    hide: () => { return },
                    action: () => { return },
                    show: () => { return }
                }
        }
    }

    const actions: TableActionType[] = [
        {
            label: 'shared:delete_selected',
            key: 'remove',
            icon: 'fas fa-trash',
            onClick: () => showConfirmation('remove')
        }
    ]

    const showActions = idsChecked.length > 0;

    return {
        getConfirmationData,
        actions,
        showActions,
        idsChecked,
        checkAllOnPage,
        isAllChecked,
        toggleCheck,
        uncheckAll
    }

};

export default useFoodAction;