import { api } from '@root/app/trpc/react';

const useClientFoods = (
    day: { year: number, month: number, day: number } | null,
    clientId: string,
) => {
    const { data, refetch, isFetching, isLoading } = api.specific.consumerFood.getByClientId.useQuery({
        clientId,
        day: {
            year: day?.year ?? 0,
            month: day?.month ?? 0,
            day: day?.day ?? 0,
        },
    }, {
        enabled: !!day,
        // staleTime: Infinity, // Consider caching strategy
        // cacheTime: Infinity,
    });

    return {
        data,
        refetch,
        isFetching,
        isLoading,
    };
};

export default useClientFoods; 