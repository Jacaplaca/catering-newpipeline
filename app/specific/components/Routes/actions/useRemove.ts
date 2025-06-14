import { api } from '@root/app/trpc/react';
import { useBoolean } from 'usehooks-ts'

const useRemoveRoute = ({
    onSuccess, ids,
}: {
    onSuccess: () => unknown,
    ids: string[],
}) => {
    const { value: isConfirmationOpen, setTrue: show, setFalse: hide } = useBoolean(false)

    const removeRoutesCall = api.specific.deliveryRoute.remove.useMutation({
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
        removeRoutesCall.mutate({ ids });
    }

    return {
        action,
        isConfirmationOpen,
        show,
        hide,
        questionKey: 'shared:delete_confirmation'
    }

};

export default useRemoveRoute;
