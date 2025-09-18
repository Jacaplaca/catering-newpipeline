'use client';
import React from 'react';
import Icon from '@root/app/specific/components/Orders/ByDay/DayMealsCell/Icon';
import useClientDayMenuPdf from '@root/app/specific/components/FoodMenu/ConsumerDiets/useClientDayMenuPdf';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';

const DayMenuPdf: React.FC<{ clientId?: string, iconClass?: string }> = ({ clientId, iconClass }) => {
    const { message, lang, day } = useFoodMenuContext();
    const dayId = day.day?.year + '-' + day.day?.month + '-' + day.day?.day;
    const {
        isLoading, handleDownload, dayIdForPdf, clientIdForPdf
    } = useClientDayMenuPdf(lang, message.updateMessage);

    const thisCell = dayIdForPdf === dayId && clientIdForPdf === clientId;
    const thisCellLoading = isLoading && thisCell;

    return (
        <button
            onClick={(e) => handleDownload(e, { dayId, clientId })}
            disabled={thisCellLoading}>
            <Icon loading={thisCellLoading} icon="fa-solid fa-file-pdf" iconClass={iconClass} />
        </button>
    )
};

export default DayMenuPdf;
