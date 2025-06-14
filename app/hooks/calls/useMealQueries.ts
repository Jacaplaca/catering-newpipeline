import { api } from '@root/app/trpc/react';

const useMealQueries = () => {
    const { data, isFetching, isLoading } = api.specific.meal.getAll.useQuery(undefined, {
        // staleTime: Infinity, // Consider caching strategy
        // cacheTime: Infinity,
    });

    return {
        data,
        isFetching,
        isLoading,
    };
};

export default useMealQueries; 