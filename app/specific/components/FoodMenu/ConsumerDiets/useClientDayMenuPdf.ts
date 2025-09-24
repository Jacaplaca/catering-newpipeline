import { type UpdateMessageType } from '@root/app/hooks/useMessage';
import downloadPdfFromBase64 from '@root/app/lib/pdf/downloadPdfFromBase64';
import { api } from '@root/app/trpc/react';
import { useEffect, useState } from 'react';

const useClientDayMenuPdf = (lang: LocaleApp, updateMessage: UpdateMessageType) => {
    const [clientId, setClientId] = useState<string | undefined>(undefined);
    const [dayId, setDayId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [week, setWeek] = useState<boolean | undefined>(undefined);

    const { data: pdfData, error: pdfError } = api.specific.order.dayMenuPdf.useQuery(
        { clientId: clientId ?? '', dayId: dayId ?? '', lang, week },
        { enabled: Boolean(dayId) }
    );

    const handleDownload = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, { dayId, clientId, week }: { dayId: string | null, clientId?: string, week?: boolean }) => {
        e.stopPropagation();
        setIsLoading(true);
        setClientId(clientId);
        setDayId(dayId);
        setWeek(week);
    };

    useEffect(() => {
        if (pdfData) {
            downloadPdfFromBase64(pdfData);
            setIsLoading(false);
            setClientId(undefined);
            setDayId(null);
            setWeek(undefined);
        }
    }, [pdfData]);

    useEffect(() => {
        if (pdfError) {
            updateMessage({ content: pdfError.message, status: 'error', timeout: 5000 });
            setIsLoading(false);
            setClientId(undefined);
            setDayId(null);
            setWeek(undefined);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pdfError]);

    return {
        isLoading,
        handleDownload,
        clientIdForPdf: clientId,
        dayIdForPdf: dayId,
        weekForPdf: week,
    };
};

export default useClientDayMenuPdf;
