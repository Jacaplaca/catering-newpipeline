import dayIdParser from '@root/app/server/api/routers/specific/libs/dayIdParser';
import { api } from '@root/app/trpc/react';

const useMenuQueries = (
    day: { year: number, month: number, day: number } | null,
    templateDayObject: { id: string, name: string } | null,
) => {
    const { data: existingMenu, refetch: refetchMenu, isFetching: menuFetching, isLoading: menuLoading } = api.specific.regularMenu.getOne.useQuery({
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

    const { data: templateDayMenu, isFetching: templateDayMenuFetching, isLoading: templateDayMenuLoading } = api.specific.regularMenu.getOne.useQuery({
        day: templateDayObject?.name ? dayIdParser(templateDayObject.name, 1) : undefined,
    }, {
        enabled: !!templateDayObject?.name,
        // staleTime: Infinity, // Consider caching strategy
        // cacheTime: Infinity,
    });

    return {
        existingMenu,
        refetchMenu,
        menuFetching,
        menuLoading,
        templateDayMenu,
        templateDayMenuFetching,
        templateDayMenuLoading,
    };
};

export default useMenuQueries; 