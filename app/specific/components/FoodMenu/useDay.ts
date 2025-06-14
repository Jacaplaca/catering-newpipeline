import getCurrentTime from '@root/app/lib/date/getCurrentTime';
import { getNextWorkingDay } from '@root/app/specific/lib/dayInfo';
import { api } from "@root/app/trpc/react";
import { useEffect, useState } from "react";

const useDay = () => {

    const [day, setDay] = useState<{
        year: number,
        month: number,
        day: number,
    } | null>(null);

    const { data: cateringSettings } = api.specific.settings.deadlines.useQuery({ clientId: '' }, { enabled: true });

    const updateDay = (value: { year: number, month: number, day: number }) => {
        setDay(value);
    }

    useEffect(() => {
        const now = getCurrentTime();
        const nextWorkingDay = getNextWorkingDay(now, cateringSettings ?? { timeZone: 'Europe/Warsaw' });
        setDay({
            year: nextWorkingDay.getFullYear(),
            month: nextWorkingDay.getMonth(),
            day: nextWorkingDay.getDate(),
        });
    }, [cateringSettings]);

    return { day, updateDay, cateringSettings };
}

export default useDay;
