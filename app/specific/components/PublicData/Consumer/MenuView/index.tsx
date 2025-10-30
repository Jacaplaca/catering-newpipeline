import { type CleanedDailyMenu, type CleanedMealGroup, type CleanedWeeklyMenu } from '@root/app/server/api/routers/specific/libs/regularMenu/transformMenuForConsumer';
import { pl } from 'date-fns/locale/pl';
import { registerLocale } from 'react-datepicker';
import { format } from 'date-fns-tz';
import dateToWeek from '@root/app/specific/lib/dateToWeek';
import { type ConsumerFoodItem, type MealInConsumerDataItem, type MealsInConsumerByIdMap } from '@root/app/server/api/routers/specific/libs/getGroupedConsumerFoodDataObject';
import FoodItem from '@root/app/specific/components/PublicData/Consumer/MenuView/FoodItem';
import translate from '@root/app/lib/lang/translate';

registerLocale('pl', pl);

const parseDateString = (dateStr: string) => {
    const parts = dateStr.split('-').map(part => parseInt(part, 10));
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];

    if (year === undefined || month === undefined || day === undefined) {
        const notValidDate = new Date(dateStr);
        return { year: notValidDate.getFullYear(), month: notValidDate.getMonth(), day: notValidDate.getDate() };
    }

    return { year, month, day };
}

const formatDate = (dateStr: string) => {
    const parsedDate = parseDateString(dateStr);
    const date = new Date(parsedDate.year, parsedDate.month, parsedDate.day);
    const { week, weekYear } = dateToWeek(date);
    const formattedDate = `${format(date, 'EEEE, d MMMM yyyy', { locale: pl })} (${week}/${weekYear})`;
    // return `${dateStr} ${JSON.stringify(date)} ${date.toLocaleDateString('pl-PL', { weekday: 'long' })} ${formattedDate} ${date.toISOString()}`
    return formattedDate;
};

const sortMealGroups = (dayData: CleanedDailyMenu): [string, CleanedMealGroup][] => {
    return (Object.entries(dayData)
        .filter((entry): entry is [string, CleanedMealGroup] => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const [, value] = entry;
            return value !== null && typeof value === 'object' && 'mealGroup' in value;
        })
        .sort(([, a], [, b]) => {
            const orderA = a.mealGroup?.order ?? 999;
            const orderB = b.mealGroup?.order ?? 999;
            return orderA - orderB;
        }));
};

// Reusable Components
const DateHeader = ({ date }: { date: string }) => (
    <div className="dark:bg-darkmode-secondary-accent bg-secondary  px-6 py-4">
        <h2 className="text-2xl font-bold text-text dark:text-darkmode-text capitalize">
            <i className="fa-solid fa-calendar-day mr-2"></i>
            {formatDate(date)}
        </h2>
    </div>
);

const ChangesBadge = ({ count, dictionary }: { count: number, dictionary: Record<string, string> }) => (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
        <i className="fa-solid fa-pen-to-square mr-1"></i>
        {count} {translate(dictionary, 'public-profile:changes')}
    </span>
);



const FoodGrid = ({ consumerFoods, dictionary }: { consumerFoods: ConsumerFoodItem[], dictionary: Record<string, string> }) => {
    const count = consumerFoods.length;

    // Dynamic column class based on count
    const getGridClass = () => {
        if (count === 1) return 'grid-cols-1';
        if (count === 2) return 'grid-cols-1 md:grid-cols-2';
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    };

    return (
        <div className={`grid ${getGridClass()} gap-4`}>
            {consumerFoods.map((consumerFood) => (
                <FoodItem key={consumerFood.id} consumerFood={consumerFood} dictionary={dictionary} />
            ))}
        </div>
    );
};

const MealSection = ({ mealData, dictionary }: { mealData: MealInConsumerDataItem, dictionary: Record<string, string> }) => {
    const { meal, consumerFoods, changesCount } = mealData;

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-2">
                <h4 className="text-lg font-semibold text-text dark:text-darkmode-text">
                    {meal.name}
                </h4>
                {changesCount > 0 && <ChangesBadge count={changesCount} dictionary={dictionary} />}
            </div>
            <FoodGrid consumerFoods={consumerFoods} dictionary={dictionary} />
        </div>
    );
};

const MealGroupSection = ({ groupKey, mealGroup, meals, dictionary }: { groupKey: string; mealGroup: { name: string }; meals: MealsInConsumerByIdMap, dictionary: Record<string, string> }) => (
    <div key={groupKey} className="space-y-6">
        <div className="flex items-center space-x-3 pb-3 border-b-2 border-border dark:border-darkmode-border">
            <h3 className="text-xl font-semibold text-text dark:text-darkmode-text">
                {mealGroup.name}
            </h3>
        </div>
        <div className="space-y-8">
            {Object.entries(meals).map(([mealId, mealData]) => (
                <MealSection key={mealId} mealData={mealData} dictionary={dictionary} />
            ))}
        </div>
    </div>
);

const DayCard = ({ date, dayData, dictionary }: { date: string; dayData: CleanedDailyMenu, dictionary: Record<string, string> }) => {
    const sortedMealGroups = sortMealGroups(dayData);

    return (
        <div className="border border-secondary/50 dark:border-darkmode-secondary/50 rounded-xl  overflow-hidden">
            <DateHeader date={date} />
            <div className="p-6 space-y-8">
                {sortedMealGroups.map(([groupKey, mealGroupData]) => (
                    <MealGroupSection
                        key={groupKey}
                        groupKey={groupKey}
                        mealGroup={mealGroupData.mealGroup}
                        meals={mealGroupData.meals}
                        dictionary={dictionary}
                    />
                ))}
            </div>
        </div>
    );
};

// Main Component
const MenuView = ({ data, dictionary }: { data: CleanedWeeklyMenu, dictionary: Record<string, string> }) => {
    const dates = Object.keys(data).sort();

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="space-y-6">
                    {dates.map((date) => {
                        const dayData = data[date];
                        if (!dayData) return null;
                        return <DayCard key={date} date={date} dayData={dayData} dictionary={dictionary} />;
                    })}
                </div>

                <div className="mt-12 text-center text-neutral-600 dark:text-neutral-400 text-sm">
                    <p>{translate(dictionary, 'public-profile:menu_prepared_for_you')}</p>
                </div>
            </div>
        </div>
    );
};

export default MenuView;