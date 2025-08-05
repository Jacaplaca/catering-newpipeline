import { api } from '@root/app/trpc/react';

const useCreateAssignments = ({ day, clientId }: { day: { year: number, month: number, day: number } | null, clientId: string }) => {
    const utils = api.useUtils();
    const { mutate, isPending } = api.specific.regularMenu.createAssignments.useMutation({
        onSuccess: () => {
            void utils.specific.consumerFood.getByClientId.invalidate({
                clientId,
                day: day ?? { year: 0, month: 0, day: 0 },
            });
            // void utils.specific.regularMenu.getClientsWithCommonAllergens.invalidate();
        },
    });

    const createAutoAssignments = (consumerId: string) => {
        day && clientId && consumerId && mutate({
            day,
            clientId,
            consumerId,
        });
    };
    return {
        createAutoAssignments,
        isPending,
    };
};

export default useCreateAssignments; 