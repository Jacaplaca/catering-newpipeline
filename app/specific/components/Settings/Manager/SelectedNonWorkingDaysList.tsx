import { type FunctionComponent } from 'react';
import { format } from 'date-fns';
import { type Locale } from 'date-fns';
import translate from '@root/app/lib/lang/translate';

// Definicja nowego komponentu RemoveButton
interface RemoveButtonProps {
    onClick: () => void;
    title: string;
    ariaLabel?: string;
    className?: string;
    iconBaseClass?: string; // Np. "fas", "far", "fab"
    iconNameClass: string; // Np. "fa-times", "fa-trash"
    iconExtraClasses?: string; // Np. "fa-sm", "text-red-500"
}

const RemoveButton: FunctionComponent<RemoveButtonProps> = ({
    onClick,
    title,
    ariaLabel,
    className = '',
    iconBaseClass = 'fas', // Domyślnie solid icons
    iconNameClass,
    iconExtraClasses = '',
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            aria-label={ariaLabel ?? title}
            className={`
                inline-flex items-center justify-center
                bg-transparent rounded-full
                text-neutral-400 dark:text-neutral-500
                hover:text-red-500 hover:bg-red-100
                dark:hover:text-red-400 dark:hover:bg-red-700/30
                focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-500
                transition-all duration-150 ease-in-out
                ${className}
            `}
        >
            <i className={`${iconBaseClass} ${iconNameClass} ${iconExtraClasses}`}></i>
        </button>
    );
};

type SelectedNonWorkingDaysListProps = {
    groupedDates: Record<string, Date[]>;
    dictionary: Record<string, string>;
    onRemoveDate: (dateToRemove: Date) => void;
    onRemoveMonth: (datesInMonthToRemove: Date[]) => void;
    locale: Locale;
};

const SelectedNonWorkingDaysList: FunctionComponent<SelectedNonWorkingDaysListProps> = ({
    groupedDates,
    dictionary,
    onRemoveDate,
    onRemoveMonth,
    locale,
}) => {
    if (Object.keys(groupedDates).length === 0) {
        return null;
    }

    return (
        <div className="flex-1">
            <h4 className="mb-4 text-lg font-semibold text-neutral-700 dark:text-neutral-200">
                {dictionary?.selectedFutureNonWorkingDays ?? translate(dictionary, 'settings:selected_future_non_working_days')}
            </h4>
            <div className="flex flex-row flex-wrap gap-4">
                {Object.entries(groupedDates).map(([monthYear, datesInMonth]) => (
                    <div
                        key={monthYear}
                        className="
                            relative min-w-[200px] basis-[200px]
                            p-4 border border-neutral-300 dark:border-neutral-600 rounded-lg
                            bg-white dark:bg-neutral-800
                            shadow-md dark:shadow-lg dark:shadow-neutral-900/50"
                    >
                        <RemoveButton
                            onClick={() => onRemoveMonth(datesInMonth)}
                            title={dictionary?.removeAllFromMonth ?? translate(dictionary, 'settings:remove_all_from_month')}
                            ariaLabel={dictionary?.removeAllFromMonth ?? translate(dictionary, 'settings:remove_all_from_month')}
                            className="absolute top-3 right-3 w-6 h-6 p-1 rounded-md"
                            iconBaseClass="fas"
                            iconNameClass="fa-times"
                            iconExtraClasses="text-sm" // Kontroluje rozmiar ikony przez Font Awesome lub Tailwind
                        />
                        <h5 className="mb-3 pr-8 text-center font-semibold capitalize text-neutral-700 dark:text-neutral-200">
                            {monthYear}
                        </h5>
                        <ul className="list-none p-0 text-left">
                            {datesInMonth.map(date => (
                                <li
                                    key={date.toISOString()}
                                    className="mb-1.5 flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-300"
                                >
                                    <span>{format(date, 'd, EEEE', { locale })}</span>
                                    <RemoveButton
                                        onClick={() => onRemoveDate(date)}
                                        title={dictionary?.removeDate ?? translate(dictionary, 'settings:remove_date')}
                                        ariaLabel={dictionary?.removeDate ?? translate(dictionary, 'settings:remove_date')}
                                        className="ml-2 w-6 h-6 p-1"
                                        iconBaseClass="fas"
                                        iconNameClass="fa-times"
                                        iconExtraClasses="text-xs" // Kontroluje rozmiar ikony
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SelectedNonWorkingDaysList; 