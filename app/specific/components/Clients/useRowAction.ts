import useTableCheckbox from '@root/app/hooks/table/useTableCheckbox';
import useActivateClient from '@root/app/specific/components/Clients/actions/useActivate';
import useRemoveClient from '@root/app/specific/components/Clients/actions/useRemove';
import useRemoveClientWithForce from '@root/app/specific/components/Clients/actions/useRemoveWithForce';
import { type TableActionType } from '@root/types';
import { useState } from 'react';

const useClientAction = ({
    rows,
    onSuccess,
}: {
    rows: string[],
    onSuccess: () => unknown,
}) => {
    const { idsChecked, toggleCheck, checkAllOnPage, uncheckAll, isAllChecked } = useTableCheckbox(rows);

    const [activeAction, setActiveAction] = useState<'remove' | 'activate' | 'removeWithForce' | null>(null);

    const remove = useRemoveClient({ onSuccess, ids: idsChecked })
    const activate = useActivateClient({ onSuccess, ids: idsChecked })
    const removeWithForce = useRemoveClientWithForce({ onSuccess, ids: idsChecked })

    const showConfirmation = (type: 'remove' | 'activate' | 'removeWithForce') => {
        switch (type) {
            case 'activate':
                activate.show();
                setActiveAction('activate');
                break;
            case 'remove':
                remove.show();
                setActiveAction('remove');
                break;
            case 'removeWithForce':
                removeWithForce.show();
                setActiveAction('removeWithForce');
                break;
            default:
                break;
        }
    }

    const getConfirmationData = () => {
        switch (activeAction) {
            case 'activate':
                return activate;
            case 'remove':
                return remove;
            case 'removeWithForce':
                return removeWithForce;
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
            label: 'clients:activate_button',
            key: 'activate',
            icon: 'fas fa-lightbulb-on',
            onClick: () => showConfirmation('activate')
        },
        {
            label: 'shared:delete_selected',
            key: 'remove',
            icon: 'fas fa-trash',
            onClick: () => showConfirmation('remove')
        },
        {
            isDivider: true,
            key: 'divider',
        },
        {
            label: 'clients:delete_with_force',
            key: 'removeWithForce',
            icon: 'fas fa-trash-xmark',
            iconClassName: 'text-red-500 dark:text-red-400',
            onClick: () => showConfirmation('removeWithForce'),
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

export default useClientAction;