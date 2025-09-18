import { type UpdateMessageType } from '@root/app/hooks/useMessage';
import downloadPdfFromBase64 from '@root/app/lib/pdf/downloadPdfFromBase64';
import { api } from '@root/app/trpc/react';
import { useEffect, useState } from 'react';

const useClientDayMenuPdf = (lang: LocaleApp, updateMessage: UpdateMessageType) => {
    const [clientId, setClientId] = useState<string | undefined>(undefined);
    const [dayId, setDayId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { data: pdfData, error: pdfError } = api.specific.order.dayKitchenPdf.useQuery(
        { clientId: clientId ?? '', dayId: dayId ?? '', lang },
        { enabled: Boolean(dayId) }
    );

    const handleDownload = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, { dayId, clientId }: { dayId: string | null, clientId?: string }) => {
        e.stopPropagation();
        setIsLoading(true);
        setClientId(clientId);
        setDayId(dayId);
    };

    useEffect(() => {
        if (pdfData) {
            downloadPdfFromBase64(pdfData);
            setIsLoading(false);
            setClientId(undefined);
            setDayId(null);
        }
    }, [pdfData]);

    useEffect(() => {
        if (pdfError) {
            updateMessage({ content: pdfError.message, status: 'error', timeout: 5000 });
            setIsLoading(false);
            setClientId(undefined);
            setDayId(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pdfError]);

    return {
        isLoading,
        handleDownload,
        clientIdForPdf: clientId,
        dayIdForPdf: dayId,
    };
};

export default useClientDayMenuPdf;
