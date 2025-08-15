'use client';
import React from 'react';
import { useOrderByDayMealsTableContext } from '@root/app/specific/components/Orders/ByDayMeals/context';
import Icon from '@root/app/specific/components/Orders/ByDayMeals/DayMealsCell/Icon';

const RoutesPdf: React.FC<{ dayId: string }> = ({ dayId }) => {
    const {
        routesPdf: { isLoading, handleDownload, dayIdForPdf }
    } = useOrderByDayMealsTableContext();

    const thisCell = dayIdForPdf === dayId;
    const thisCellLoading = isLoading && thisCell;

    return (
        <button
            onClick={(e) => handleDownload(e, { dayId })}
            disabled={thisCellLoading}>
            <Icon loading={thisCellLoading} icon="fa-solid fa-truck-fast" />
        </button>
    )
};

export default RoutesPdf;
