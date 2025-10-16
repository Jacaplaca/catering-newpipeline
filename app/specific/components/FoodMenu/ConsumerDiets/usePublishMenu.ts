import { useState } from 'react';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
import { api } from '@root/app/trpc/react';

function usePublishMenu({
    clientId,
}: {
    clientId?: string,
}) {
    const utils = api.useUtils();
    const { day } = useFoodMenuContext();
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const { mutateAsync, isPending, data } = api.specific.regularMenu.closeAndPublish.useMutation({
        onError: (err) => {
            setError(err.message);
            setIsSuccess(false);
        },
        onSuccess: () => {
            setError(null);
            setIsSuccess(true);
            void utils.specific.regularMenu.getOne.invalidate();
        }
    });

    const { mutateAsync: unpublishMenuApi, isPending: isUnpending } = api.specific.regularMenu.unPublish.useMutation({
        onError: (err) => {
            // setError(err.message);
            // setIsSuccess(false);
            // void utils.specific.regularMenu.getOne.invalidate();
        },
        onSuccess: () => {
            void utils.specific.regularMenu.getOne.invalidate();
            // setError(null);
            // setIsSuccess(true);
        }
    });

    const reset = () => {
        setError(null);
        setIsSuccess(false);
    }

    const publishMenu = async () => {
        if (!day.day) {
            setError("Cannot publish, day is not selected.");
            setIsSuccess(false);
            return;
        }
        try {
            reset();
            await mutateAsync({ day: day.day, clientId });
        } catch (err) {
            // Obsługa błędów jest już w onError, ale dla pewności:
            setError(err instanceof Error ? err.message : "Unknown error");
            setIsSuccess(false);
        }
    };

    const unpublishMenu = () => {
        if (!day.day) {
            setError("Cannot unpublish, day is not selected.");
            setIsSuccess(false);
            return;
        }
        void unpublishMenuApi({ day: day.day, clientId });
    };

    return {
        publishMenu,
        isPending,
        error,
        isSuccess,
        reset,
        data,
        unpublishMenu,
        isUnpending,
    };
}

export default usePublishMenu;