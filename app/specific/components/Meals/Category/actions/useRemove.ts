import { api } from '@root/app/trpc/react';
import { useBoolean } from 'usehooks-ts'

const useRemoveMealCategory = ({
    onSuccess, ids,
}: {
    onSuccess: () => unknown,
    ids: string[],
}) => {
    const { value: isConfirmationOpen, setTrue: show, setFalse: hide } = useBoolean(false)

    const removeMealCategoryCall = api.specific.mealCategory.remove.useMutation({
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
        removeMealCategoryCall.mutate({ ids });
    }

    return {
        action,
        isConfirmationOpen,
        show,
        hide,
        questionKey: 'shared:delete_confirmation'
    }

};

export default useRemoveMealCategory;
