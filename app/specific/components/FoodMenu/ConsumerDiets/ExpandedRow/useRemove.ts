import { api } from '@root/app/trpc/react';
import { useBoolean } from 'usehooks-ts'

const useRemoveMenu = ({
    onSuccess, clientId, day,
}: {
    onSuccess: () => unknown,
    clientId: string,
    day: { year: number, month: number, day: number } | null,
}) => {

    const { value: isConfirmationOpen, setTrue: show, setFalse: hide } = useBoolean(false)

    const removeByClientMutation = api.specific.regularMenu.removeByClient.useMutation({
        onSuccess: () => {
            onSuccess();
        },
        onError: (error) => {
            console.log(error.data, error.message, error.shape);
        },
        onSettled: () => {
            hide();
        }
    });

    const action = () => {
        removeByClientMutation.mutate({ clientId, day: day ?? { year: 0, month: 0, day: 0 } });
    }

    return {
        action,
        isConfirmationOpen,
        show,
        hide,
        questionKey: 'menu-creator:remove_client_standard_menu_confirmation'
    }

};

export default useRemoveMenu;
