import { type UpdateMessageType } from '@root/app/hooks/useMessage';
import downloadPdfFromBase64 from '@root/app/lib/pdf/downloadPdfFromBase64';
import { api } from '@root/app/trpc/react';
import { MealType } from '@root/types/specific';
import { useEffect, useState } from 'react';

const useMealPdf = (lang: LocaleApp, updateMessage: UpdateMessageType) => {
    const [dayId, setDayId] = useState<string | null>(null);
    const [mealType, setMealType] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { data: pdfData, error: pdfError } = api.specific.order.dayPdf2.useQuery(
        { dayId: dayId ?? '', mealId: mealType ?? 'breakfast', lang },
        { enabled: Boolean(dayId) && Boolean(mealType) }
    );

    const handleDownload = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, { dayId, mealType }: { dayId: string, mealType: string }) => {
        e.stopPropagation();
        setIsLoading(true);
        setDayId(dayId);
        setMealType(mealType);
    };

    useEffect(() => {
        if (pdfData) {
            downloadPdfFromBase64(pdfData);
            setIsLoading(false);
            setDayId(null);
            setMealType(null);
        }
    }, [pdfData]);

    useEffect(() => {
        if (pdfError) {
            updateMessage({ content: pdfError.message, status: 'error', timeout: 5000 });
            setIsLoading(false);
            setDayId(null);
            setMealType(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pdfError]);

    return {
        isLoading,
        handleDownload,
        dayIdForPdf: dayId,
        mealTypeForPdf: mealType,
    };
};

export default useMealPdf;
