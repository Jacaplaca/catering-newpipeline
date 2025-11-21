'use client';
import { api } from '@root/app/trpc/react';
import { useEffect, useState } from 'react';
import { differenceInDays } from 'date-fns';
import translate from '@root/app/lib/lang/translate';

const PaymentReminder = ({ dictionary }: { dictionary: Record<string, string> }) => {
    const { data: paymentReminder, isLoading } = api.specific.paymentReminder.useQuery();
    const [overdueDays, setOverdueDays] = useState<number | null>(null);
    const [isVisible, setIsVisible] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!paymentReminder?.dueDate) return;

        const calculateState = () => {
            const now = new Date();
            const due = new Date(paymentReminder.dueDate);

            if (now <= due) {
                // Przyszłość lub ten sam moment - brak powiadomienia
                setOverdueDays(null);
            } else {
                // Przeszłość - ile dni po terminie
                const days = differenceInDays(now, due);
                setOverdueDays(days);
            }
        };

        calculateState();
        // Sprawdzamy raz na minutę
        const timer = setInterval(calculateState, 60000);

        return () => clearInterval(timer);
    }, [paymentReminder]);

    if (!isMounted || isLoading || !paymentReminder || !isVisible || overdueDays === null) {
        return null;
    }

    // Konfiguracja stylów i zachowania w zależności od overdueDays
    let containerClasses = "";
    let iconClasses = "";
    let iconName = "";
    let title = "";
    let canClose = true;
    let paddingClass = "py-3"; // Standardowa wysokość

    if (overdueDays <= 7) {
        // 0-7 dni: Żółty, standardowa wysokość, zamykalny
        containerClasses = "bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-700";
        iconClasses = "bg-yellow-100 dark:bg-yellow-800 text-yellow-600 dark:text-yellow-200";
        iconName = "fa-info-circle";
        title = translate(dictionary, 'shared:payment_reminder_title');
        paddingClass = "py-3";
        canClose = true;
    } else if (overdueDays <= 14) {
        // 8-14 dni: Czerwony, +10% szerszy (wyższy), niezamykalny
        containerClasses = "bg-red-500 dark:bg-red-900 border-red-700 dark:border-red-900 text-white";
        iconClasses = "bg-red-600 dark:bg-red-950 text-white";
        iconName = "fa-exclamation-circle";
        title = translate(dictionary, 'shared:payment_required_title');
        paddingClass = "py-5"; // Większy padding
        canClose = false;
    } else {
        // > 14 dni: Czerwony, +20% szerszy (jeszcze wyższy), niezamykalny
        containerClasses = "bg-red-600 dark:bg-red-800 border-red-800 dark:border-red-900 text-white";
        iconClasses = "bg-red-700 dark:bg-red-900 text-white";
        iconName = "fa-triangle-exclamation";
        title = translate(dictionary, 'shared:payment_urgent_title');
        paddingClass = "py-7"; // Największy padding
        canClose = false;
    }

    const dayText = overdueDays === 1
        ? translate(dictionary, 'shared:day_singular')
        : translate(dictionary, 'shared:days_plural');

    const message = (
        <span>
            {translate(dictionary, 'shared:payment_expired_message_part1')} <span className="font-bold">{overdueDays} {dayText}</span> {translate(dictionary, 'shared:payment_expired_message_part2')}
        </span>
    );

    // Specjalne style tekstu dla wersji czerwonej (biały tekst) vs żółtej (ciemny tekst)
    const isCritical = overdueDays > 7;
    const titleColorClass = isCritical ? "text-white" : "text-amber-900 dark:text-amber-50";
    const textColorClass = isCritical ? "text-red-50" : "text-amber-800 dark:text-amber-200";

    return (
        <div className={`w-full border-b-2 shadow-md transition-all duration-300 ${containerClasses}`}>
            <div className={`container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${paddingClass}`}>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center flex-1 min-w-0">
                        <span className={`flex items-center justify-center w-10 h-10 rounded-full mr-4 shrink-0 shadow-sm ${iconClasses}`}>
                            <i className={`fa-solid ${iconName} text-xl`}></i>
                        </span>
                        <div className="flex flex-col sm:flex-row sm:items-center text-center sm:text-left">
                            <p className={`text-lg font-bold uppercase tracking-wide mr-3 ${titleColorClass}`}>
                                {title}
                            </p>
                            <p className={`text-base font-medium ${textColorClass}`}>
                                {message}
                            </p>
                        </div>
                    </div>

                    {canClose && (
                        <button
                            onClick={() => setIsVisible(false)}
                            className={`p-2 rounded-full transition-colors duration-200 shrink-0 hover:bg-black/5 text-neutral-500 dark:text-neutral-300`}
                            aria-label="Zamknij powiadomienie"
                        >
                            <i className="fa-solid fa-xmark text-xl"></i>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PaymentReminder;
