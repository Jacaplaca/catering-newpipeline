'use client';
import React from 'react';
import Icon from '@root/app/specific/components/Orders/ByDay/DayMealsCell/Icon';
import useClientDayMenuPdf from '@root/app/specific/components/FoodMenu/ConsumerDiets/useClientDayMenuPdf';
// import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
// import dayObj2dayId from '@root/app/lib/date/dayObj2dayId';
import Tooltip from '@root/app/_components/ui/Tooltip';
import translate from '@root/app/lib/lang/translate';
import date2dayObj from '@root/app/lib/date/date2dayObj';

const WeekMenuForClientPdf: React.FC<{
    clientId?: string
    iconClass?: string
    tooltipLabel?: string
    lang: LocaleApp
    dictionary: Record<string, string>
    day: Date
}> = ({ clientId, iconClass, tooltipLabel, lang, dictionary, day }) => {
    // const { message, lang, day, dictionary } = useFoodMenuContext();
    const dayId = date2dayObj(day);
    const {
        isLoading, handleDownload, dayIdForPdf, clientIdForPdf
    } = useClientDayMenuPdf(lang);

    const thisCell = dayIdForPdf === dayId && clientIdForPdf === clientId;
    const thisCellLoading = isLoading && thisCell;

    return (
        <Tooltip content={translate(dictionary, tooltipLabel)}>
            <button
                onClick={(e) => handleDownload(e, { dayId, clientId, week: true })}
                disabled={thisCellLoading}>
                <Icon loading={thisCellLoading} icon={'fa-solid fa-file-pdf'} iconClass={iconClass} />
            </button>
        </Tooltip>
    )
};

export default WeekMenuForClientPdf;
