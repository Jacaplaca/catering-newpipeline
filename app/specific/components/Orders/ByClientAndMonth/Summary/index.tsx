import { useByClientAndMonthTableContext } from '@root/app/specific/components/Orders/ByClientAndMonth/context';
import translate from '@root/app/lib/lang/translate';
import { type FunctionComponent } from 'react';

interface SummaryCardProps {
    title: string;
    value: number;
    subtitle?: string;
    subtitleValue?: number;
    icon?: string;
    colorClass?: string;
}

const SummaryCard: FunctionComponent<SummaryCardProps> = ({
    title,
    value,
    subtitle,
    subtitleValue,
    icon = 'fa-solid fa-chart-bar',
    colorClass = 'text-blue-600 dark:text-blue-400'
}) => {
    return (
        <div className="bg-form dark:bg-darkmode-form rounded-xl shadow-big dark:shadow-darkmode-big border border-border dark:border-darkmode-border p-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-text dark:text-darkmode-text">{title}</h3>
                <i className={`${icon} ${colorClass} text-lg`}></i>
            </div>
            <div className="space-y-2">
                <div className="text-2xl font-bold text-text dark:text-darkmode-text">
                    {value.toLocaleString()}
                </div>
                {subtitle && subtitleValue !== undefined && (
                    <div className="text-sm text-neutral-600 dark:text-neutral-300">
                        <span className="font-medium">{subtitle}:</span>
                        <span className="ml-1 font-semibold">{subtitleValue.toLocaleString()}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const Summary: FunctionComponent = () => {
    const {
        monthSummary: { report, isFetching },
        dictionary,
    } = useByClientAndMonthTableContext();

    if (isFetching) {
        return (
            <div className="flex justify-center items-center py-8">
                <i className="fas fa-spinner animate-spin text-2xl text-text dark:text-darkmode-text"></i>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="text-center py-8 text-neutral-600 dark:text-neutral-400">
                {translate(dictionary, 'orders:no_data_available')}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Nagłówek */}
            <div className="bg-form dark:bg-darkmode-form rounded-xl shadow-big dark:shadow-darkmode-big border border-border dark:border-darkmode-border p-6">
                <h2 className="text-2xl font-bold text-text dark:text-darkmode-text mb-2">
                    <i className="fa-solid fa-calendar-days mr-2 text-blue-600 dark:text-blue-400"></i>
                    {translate(dictionary, 'orders:month_summary_title')}
                </h2>
                <p className="text-neutral-600 dark:text-neutral-300">
                    {translate(dictionary, 'orders:month_summary_description')}
                </p>
            </div>

            {/* Łączne statystyki */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SummaryCard
                    title={translate(dictionary, 'orders:total_orders')}
                    value={report.totalOrders}
                    icon="fa-solid fa-shopping-cart"
                    colorClass="text-green-600 dark:text-green-400"
                />
                <SummaryCard
                    title={translate(dictionary, 'orders:total_meals')}
                    value={report.totalMeals}
                    icon="fa-solid fa-utensils"
                    colorClass="text-orange-600 dark:text-orange-400"
                />
            </div>

            {/* Posiłki standardowe */}
            <div>
                <h3 className="text-lg font-semibold text-text dark:text-darkmode-text mb-4">
                    <i className="fa-solid fa-bowl-food mr-2 text-blue-600 dark:text-blue-400"></i>
                    {translate(dictionary, 'orders:standard_meals')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SummaryCard
                        title={translate(dictionary, 'orders:breakfasts')}
                        value={report.breakfastStandard}
                        icon="fa-solid fa-mug-saucer"
                        colorClass="text-yellow-600 dark:text-yellow-400"
                    />
                    <SummaryCard
                        title={translate(dictionary, 'orders:lunches')}
                        value={report.lunchStandard}
                        subtitle={translate(dictionary, 'orders:before_deadline')}
                        subtitleValue={report.lunchStandardBeforeDeadline}
                        icon="fa-solid fa-bowl-rice"
                        colorClass="text-red-600 dark:text-red-400"
                    />
                    <SummaryCard
                        title={translate(dictionary, 'orders:dinners')}
                        value={report.dinnerStandard}
                        subtitle={translate(dictionary, 'orders:before_deadline')}
                        subtitleValue={report.dinnerStandardBeforeDeadline}
                        icon="fa-solid fa-pizza-slice"
                        colorClass="text-purple-600 dark:text-purple-400"
                    />
                </div>
            </div>

            {/* Posiłki dietetyczne */}
            <div>
                <h3 className="text-lg font-semibold text-text dark:text-darkmode-text mb-4">
                    <i className="fa-solid fa-leaf mr-2 text-green-600 dark:text-green-400"></i>
                    {translate(dictionary, 'orders:diet_meals')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SummaryCard
                        title={translate(dictionary, 'orders:diet_breakfasts')}
                        value={report.breakfastDiet}
                        icon="fa-solid fa-seedling"
                        colorClass="text-yellow-600 dark:text-yellow-400"
                    />
                    <SummaryCard
                        title={translate(dictionary, 'orders:diet_lunches')}
                        value={report.lunchDiet}
                        subtitle={translate(dictionary, 'orders:before_deadline')}
                        subtitleValue={report.lunchDietCountBeforeDeadline}
                        icon="fa-solid fa-carrot"
                        colorClass="text-red-600 dark:text-red-400"
                    />
                    <SummaryCard
                        title={translate(dictionary, 'orders:diet_dinners')}
                        value={report.dinnerDiet}
                        subtitle={translate(dictionary, 'orders:before_deadline')}
                        subtitleValue={report.dinnerDietCountBeforeDeadline}
                        icon="fa-solid fa-apple-whole"
                        colorClass="text-purple-600 dark:text-purple-400"
                    />
                </div>
            </div>
        </div>
    );
};

export default Summary;