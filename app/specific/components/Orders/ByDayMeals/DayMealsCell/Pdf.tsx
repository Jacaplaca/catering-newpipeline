'use client';

import React from 'react';
import { useOrderByDayMealsTableContext } from '@root/app/specific/components/Orders/ByDayMeals/context';
import Icon from '@root/app/specific/components/Orders/ByDayMeals/DayMealsCell/Icon';

const OrderPdf: React.FC<{ meal: string, dayId: string }> = ({ meal, dayId }) => {
    const {
        mealPdf: { isLoading, handleDownload, dayIdForPdf, mealTypeForPdf }
    } = useOrderByDayMealsTableContext();

    const thisCell = dayIdForPdf === dayId && mealTypeForPdf === meal;
    const thisCellLoading = isLoading && thisCell;

    return (
        <button onClick={(e) => handleDownload(e, { dayId, mealType: meal })} disabled={thisCellLoading}>
            <Icon loading={thisCellLoading} icon="fa-file-pdf" />
        </button>
    )
};

export default OrderPdf;
