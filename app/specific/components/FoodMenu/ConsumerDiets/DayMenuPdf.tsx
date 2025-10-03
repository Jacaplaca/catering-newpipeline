'use client';
import React from 'react';
import Icon from '@root/app/specific/components/Orders/ByDay/DayMealsCell/Icon';
import useClientDayMenuPdf from '@root/app/specific/components/FoodMenu/ConsumerDiets/useClientDayMenuPdf';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
import dayObj2dayId from '@root/app/lib/date/dayObj2dayId';
import Tooltip from '@root/app/_components/ui/Tooltip';
import translate from '@root/app/lib/lang/translate';

const DayMenuPdf: React.FC<{
    clientId?: string,
    iconClass?: string,
    week?: boolean,
    icon?: string,
    perCustomer?: boolean,
    tooltipLabel?: string
}> = ({ clientId, iconClass, week, icon = 'fa-solid fa-file-pdf', perCustomer, tooltipLabel }) => {
    const { message, lang, day, dictionary } = useFoodMenuContext();
    const dayId = day.day ? dayObj2dayId(day.day) : null;
    const {
        isLoading, handleDownload, dayIdForPdf, clientIdForPdf
    } = useClientDayMenuPdf(lang, message.updateMessage);

    const thisCell = dayIdForPdf === dayId && clientIdForPdf === clientId;
    const thisCellLoading = isLoading && thisCell;

    // const getTooltipLabel = () => {}

    // let tooltipLabel = week ? 'menu-creator:week-one-client-menu-pdf' : 'menu-creator:day-one-client-menu-pdf';
    // if (!clientId) {
    //     tooltipLabel = 'menu-creator:day-all-clients-menu-pdf';
    // }

    return (
        <Tooltip content={translate(dictionary, tooltipLabel)}>
            <button
                onClick={(e) => handleDownload(e, { dayId, clientId, week, perCustomer })}
                disabled={thisCellLoading}>
                <Icon loading={thisCellLoading} icon={icon} iconClass={iconClass} />
            </button>
        </Tooltip>
    )
};

export default DayMenuPdf;
