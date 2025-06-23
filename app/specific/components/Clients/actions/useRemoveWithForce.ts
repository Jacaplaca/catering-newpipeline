import { api } from '@root/app/trpc/react';
import { useBoolean } from 'usehooks-ts'

const useRemoveClientWithForce = ({
    onSuccess, ids,
}: {
    onSuccess: () => unknown,
    ids: string[],
}) => {
    const { value: isConfirmationOpen, setTrue: show, setFalse: hide } = useBoolean(false)

    const removeUsersCall = api.specific.client.deleteOne.useMutation({
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
        removeUsersCall.mutate({ ids, forceRemove: true });
    }

    return {
        action,
        isConfirmationOpen,
        show,
        hide,
        questionKey: 'clients:delete_confirmation_with_force'
    }

};

export default useRemoveClientWithForce;
