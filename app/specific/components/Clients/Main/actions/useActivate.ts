import { api } from '@root/app/trpc/react';
import { useBoolean } from 'usehooks-ts'

const useActivateClient = ({
    onSuccess, ids,
}: {
    onSuccess: () => unknown,
    ids: string[],
}) => {
    const { value: isConfirmationOpen, setTrue: show, setFalse: hide } = useBoolean(false)

    const activateUsersCall = api.specific.client.activate.useMutation({
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
        activateUsersCall.mutate({ ids });
    }

    return {
        action,
        isConfirmationOpen,
        show,
        hide,
        questionKey: 'clients:activate_confirmation'
    }

};

export default useActivateClient;
