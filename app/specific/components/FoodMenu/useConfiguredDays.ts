import { api } from '@root/app/trpc/react';
import { useState } from "react";

const useConfiguredDays = () => {
    const [pickedMonth, setPickedMonth] = useState<Date | null>(new Date());
    const { data: configuredDays } = api.specific.regularMenu.configuredDays.useQuery({
        month: pickedMonth?.getMonth() ?? 0,
        year: pickedMonth?.getFullYear() ?? 0,
    });

    const onMonthChange = (date: Date) => {
        setPickedMonth(date);
    }

    return { pickedMonth, onMonthChange, configuredDays };
}

export default useConfiguredDays;