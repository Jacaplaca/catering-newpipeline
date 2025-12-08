import { api } from '@root/app/trpc/react';
import { useEffect, useState } from 'react';
import date2dayObj from '@root/app/lib/date/date2dayObj';

function useFetchConsumersWeekMenu({
    consumerId,
    initialDate,
    // lang,
}: {
    consumerId: string,
    initialDate?: Date,
    // lang: LocaleApp,
}) {
    const [dayId, setDayId] = useState(initialDate ? date2dayObj(initialDate) : '');
    const { data, isFetching }
        = api.specific.regularMenu.getConsumerWeekMenu.useQuery({ consumerId, dayId: dayId }, {
            enabled: !!consumerId && !!dayId,
        });

    const updateDay = (dayDate?: Date) => {
        dayDate ? setDayId(date2dayObj(dayDate)) : setDayId("");
    }

    // useEffect(() => {
    //     // console.log('useEffect', consumerId);
    // }, [consumerId]);

    return {
        data,
        isFetching,
        updateDay,
    }
}

export default useFetchConsumersWeekMenu;
