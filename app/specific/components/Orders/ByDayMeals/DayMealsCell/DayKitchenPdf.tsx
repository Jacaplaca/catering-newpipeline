'use client';
import React from 'react';
import Icon from '@root/app/specific/components/Orders/ByDay/DayMealsCell/Icon';
import { useOrderByDayMealsTableContext } from '@root/app/specific/components/Orders/ByDayMeals/context';

const DayKitchenPdf: React.FC<{ dayId: string }> = ({ dayId }) => {
    const {
        dayKitchenPdf: { isLoading, handleDownload, dayIdForPdf }
    } = useOrderByDayMealsTableContext();

    const thisCell = dayIdForPdf === dayId;
    const thisCellLoading = isLoading && thisCell;

    return (
        <button
            onClick={(e) => handleDownload(e, { dayId })}
            disabled={thisCellLoading}>
            <Icon loading={thisCellLoading} icon="fa-solid fa-hat-chef" />
        </button>
    )
};

export default DayKitchenPdf;
