import { useOrderByDayTableContext } from '@root/app/specific/components/Orders/ByDay/context';
import translate from '@root/app/lib/lang/translate';

const SummaryStandard = () => {

    const {
        dictionary,
        row: { summaryStandard, standard },
    } = useOrderByDayTableContext();


    const translations = {
        breakfast: translate(dictionary, 'orders:breakfast'),
        lunch: translate(dictionary, 'orders:lunch'),
        dinner: translate(dictionary, 'orders:dinner'),
        unassignedRoute: translate(dictionary, 'orders:unassigned_route'),
    }

    return (
        <div className='flex flex-col gap-2 items-center'>
            <h3 className='text-lg uppercase font-semibold text-neutral-800 dark:text-neutral-200'>{translate(dictionary, 'orders:standard')}</h3>
            <div
                className='flex flex-row gap-10 items-start justify-center flex-wrap'
            >
                {Object.entries(summaryStandard)
                    .map(([mealType, totalMealsForMealType]) => {
                        const hasClientDetailsForMealType = Object.values(standard).some(routeData => {
                            const mealsForRouteAndType = routeData[mealType as keyof typeof routeData] as { clientCode: string, meals: number }[] | undefined;
                            return mealsForRouteAndType && mealsForRouteAndType.length > 0;
                        });

                        return (
                            <div key={mealType} className='border-[1px] border-neutral-400 dark:border-neutral-600 p-4 px-6 rounded-md min-w-[250px] mb-4'>
                                <div className={`flex flex-row gap-4
                        items-baseline mb-2 
                        `}>
                                    <div
                                        className='font-bold text-base text-neutral-800 dark:text-neutral-200'
                                    >{translations[mealType as keyof Omit<typeof translations, 'unassignedRoute'>]}:{' '}</div>
                                    <div className='text-lg font-semibold text-neutral-800 dark:text-neutral-200'>
                                        {totalMealsForMealType}
                                    </div>
                                </div>
                                <div>
                                    {hasClientDetailsForMealType && Object.entries(standard)
                                        .map(([routeName, routeData]) => {
                                            const mealsForRouteAndType = routeData[mealType as keyof typeof routeData] as { clientCode: string, meals: number }[] | undefined;

                                            if (!mealsForRouteAndType || mealsForRouteAndType.length === 0) {
                                                return null;
                                            }

                                            return (
                                                <div key={routeName} className="mt-2">
                                                    <h4 className="font-semibold text-sm italic text-neutral-600 dark:text-neutral-400 mb-1 flex flex-row items-center justify-center">
                                                        {/* <span className='mr-1'><i className='fas fa-truck-fast'></i></span> */}
                                                        <span className='font-normal'>{routeName === "unassigned" ? translations.unassignedRoute : routeName}</span>
                                                    </h4>
                                                    {mealsForRouteAndType.map(({ clientCode, meals }, index) => (
                                                        <div
                                                            key={`${clientCode}-${index}`}
                                                            className={`flex flex-row gap-4 items-center justify-between
                                                                text-neutral-800 dark:text-neutral-200 text-sm
                                                                py-1
                                                                ${index < mealsForRouteAndType.length - 1 ? 'border-b-[1px] border-neutral-300 dark:border-neutral-700' : ''}
                                                            `}
                                                        >
                                                            <div>{clientCode}</div>
                                                            <div className='font-semibold'>{meals}</div>
                                                        </div>
                                                    ))}
                                                    <div className="flex flex-row gap-4 items-center justify-end text-neutral-800 dark:text-neutral-200 text-sm py-1 mt-1 border-t-[1px] border-neutral-400 dark:border-neutral-600">
                                                        <div className="font-bold">
                                                            {
                                                                mealType === 'breakfast' ? standard[routeName]?.totalBreakfast :
                                                                    mealType === 'lunch' ? standard[routeName]?.totalLunch :
                                                                        standard[routeName]?.totalDinner
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}

export default SummaryStandard;