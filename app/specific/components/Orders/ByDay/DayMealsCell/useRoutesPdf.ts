import { type UpdateMessageType } from '@root/app/hooks/useMessage';
import downloadPdfFromBase64 from '@root/app/specific/components/Orders/ByDay/DayMealsCell/downloadPdfFromBase64';
import { api } from '@root/app/trpc/react';
import { useEffect, useState } from 'react';

const useRoutesPdf = (lang: LocaleApp, updateMessage: UpdateMessageType) => {
    const [dayId, setDayId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { data: pdfData, error: pdfError } = api.specific.order.routesPdf.useQuery(
        { dayId: dayId ?? '', lang },
        { enabled: Boolean(dayId) }
    );

    const handleDownload = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, { dayId }: { dayId: string }) => {
        e.stopPropagation();
        setIsLoading(true);
        setDayId(dayId);
    };

    useEffect(() => {
        if (pdfData) {
            downloadPdfFromBase64(pdfData);
            setIsLoading(false);
            setDayId(null);
        }
    }, [pdfData]);

    useEffect(() => {
        if (pdfError) {
            updateMessage({ content: pdfError.message, status: 'error', timeout: 5000 });
            setIsLoading(false);
            setDayId(null);
        }
    }, [pdfError]);

    return {
        isLoading,
        handleDownload,
        dayIdForPdf: dayId,
    };
};

export default useRoutesPdf;
