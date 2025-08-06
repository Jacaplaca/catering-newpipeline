import { type Consumer, type Diet } from '@prisma/client';
import MyButton from '@root/app/_components/ui/buttons/MyButton';
import translate from '@root/app/lib/lang/translate';
import { useOrderTableContext } from '@root/app/specific/components/Orders/ByOrder/context';

const DietConsumers = ({ consumers }: { consumers: Array<Consumer & { diet: Diet | null }> }) => {
    return (
        <div className={`flex flex-col gap-2`}>
            {consumers?.map((consumer) => {
                const { code, name, diet, id } = consumer;
                const { code: dietCode, description: dietDescription } = diet ?? {};
                return (
                    <div key={id} className={`bg-white dark:bg-neutral-900/40 rounded-lg  p-2`}>
                        <div className={`flex justify-between items-center mb-1
                        border-b border-neutral-100 dark:border-neutral-700
                            `}>
                            <h3 className={`font-semibold text-base`}>{name}</h3>
                            <span className={`text-sm px-2 py-1
                                text-neutral-800 dark:text-neutral-100 font-semibold
                                `}>{code}</span>
                        </div>
                        {(dietDescription ?? dietCode) && (
                            <div className={`text-sm text-neutral-800 dark:text-neutral-200 flex justify-between items-center`}>
                                <p>
                                    <span
                                        className={`text-neutral-700 text-xs dark:text-neutral-300`}
                                    >{dietDescription}</span>
                                    {dietCode && (
                                        <span className="ml-2 font-bold">
                                            {dietCode}
                                        </span>
                                    )}
                                </p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

const CancelledConsumers = ({
    currentConsumers,
    beforeDeadlineConsumers
}: {
    currentConsumers: Array<Consumer & { diet: Diet | null }>;
    beforeDeadlineConsumers: Array<Consumer & { diet: Diet | null }>;
}) => {
    const {
        dictionary,
    } = useOrderTableContext();
    // Find consumers who were in beforeDeadline but are not in current (cancelled)
    const cancelledConsumers = beforeDeadlineConsumers.filter(
        beforeConsumer => !currentConsumers.some(current => current.id === beforeConsumer.id)
    );

    if (cancelledConsumers.length === 0) return null;

    return (
        <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
            <p className="text-xs text-red-600 dark:text-red-400 mb-1 font-medium">
                {translate(dictionary, 'orders:cancelled_meals')}
            </p>
            <div className="flex flex-col gap-1">
                {cancelledConsumers.map((consumer) => {
                    const { code, name, diet, id } = consumer;
                    const { code: dietCode, description: dietDescription } = diet ?? {};
                    return (
                        <div key={id} className="bg-red-50 dark:bg-red-900/20 rounded p-1">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-medium">{name}</span>
                                <span className="font-semibold">{code}</span>
                            </div>
                            {(dietDescription ?? dietCode) && (
                                <div className="text-xs text-red-700 dark:text-red-300">
                                    <span>{dietDescription}</span>
                                    {dietCode && <span className="ml-1 font-bold">{dietCode}</span>}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const StandardMealCount = ({
    current,
    beforeDeadline,
}: {
    current: number;
    beforeDeadline?: number;
    mealType: 'breakfast' | 'lunch' | 'dinner';
}) => {
    const standardStyle = 'p-3 font-bold text-base text-center text-neutral-800 dark:text-neutral-200';

    // If no beforeDeadline data or same value, show normal
    if (!beforeDeadline || beforeDeadline === current) {
        return <div className={standardStyle}>{current}</div>;
    }

    // Calculate difference
    const difference = current - beforeDeadline;
    const isIncrease = difference > 0;
    const diffText = isIncrease ? `+${difference}` : `${difference}`;
    const diffColor = isIncrease ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

    // Show current value and difference
    return (
        <div className={standardStyle}>
            <div className="flex flex-col items-center gap-1">
                <div className="flex flex-row items-center gap-3">
                    <span>{current}</span>
                    <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600"></div>
                    <span className={`text-sm font-semibold ${diffColor}`}>
                        {diffText}
                    </span>
                </div>
            </div>
        </div>
    );
};

const OrderView = () => {
    const {
        dictionary,
        rowClick: {
            orderForView,
            orderForViewFetching
        },
        roles: {
            isManager,
        },
        openOrderModalForManager,
    } = useOrderTableContext();

    if (orderForViewFetching) return <div
        className={`flex items-center justify-center w-full h-full text-2xl p-6`}
    ><i className={`animate-spin fas fa-spinner`} /></div>;
    if (!orderForView) return <div>Error</div>;

    const headerStyle = 'p-3 font-semibold text-neutral-800 dark:text-neutral-200';

    return (
        <div className="flex flex-col h-full">
            {isManager && <MyButton
                className='w-fit bg-neutral-200 dark:bg-neutral-700 mb-4 sm:mb-0'
                onClick={() => openOrderModalForManager(orderForView.id ?? '')}
                id='edit-order-button'
                ariaLabel={translate(dictionary, 'orders:edit_order')}
                icon='fas fa-edit'
            >
                {translate(dictionary, 'orders:edit_order')}
            </MyButton>}
            <div className={`grid grid-cols-4 auto-rows-auto gap-4 p-5`}>
                <div className={`p-3 text-center`}></div>
                <div className={`${headerStyle} text-center`}>{translate(dictionary, 'orders:breakfast')}</div>
                <div className={`${headerStyle} text-center`}>{translate(dictionary, 'orders:lunch')}</div>
                <div className={`${headerStyle} text-center`}>{translate(dictionary, 'orders:dinner')}</div>
                <div className={`${headerStyle} text-right`}>{translate(dictionary, 'orders:standard')}</div>
                <StandardMealCount
                    current={orderForView.standards.breakfast}
                    mealType="breakfast"
                />
                <StandardMealCount
                    current={orderForView.standards.lunch}
                    beforeDeadline={orderForView.standardsBeforeDeadline.lunch}
                    mealType="lunch"
                />
                <StandardMealCount
                    current={orderForView.standards.dinner}
                    beforeDeadline={orderForView.standardsBeforeDeadline.dinner}
                    mealType="dinner"
                />
                <div className={`${headerStyle} text-right`}>{translate(dictionary, 'orders:diet')}</div>
                <div className="overflow-auto">
                    <DietConsumers consumers={orderForView.diet.breakfast} />
                </div>
                <div className="overflow-auto">
                    <DietConsumers consumers={orderForView.diet.lunch} />
                    <CancelledConsumers
                        currentConsumers={orderForView.diet.lunch}
                        beforeDeadlineConsumers={orderForView.dietBeforeDeadline.lunch}
                    />
                </div>
                <div className="overflow-auto">
                    <DietConsumers consumers={orderForView.diet.dinner} />
                    <CancelledConsumers
                        currentConsumers={orderForView.diet.dinner}
                        beforeDeadlineConsumers={orderForView.dietBeforeDeadline.dinner}
                    />
                </div>
            </div>
            {orderForView.notes && (
                <div className="p-5 mt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <h4 className="font-semibold mb-2 text-neutral-800 dark:text-neutral-200">
                        {translate(dictionary, 'orders:notes')}
                    </h4>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                        {orderForView.notes}
                    </p>
                </div>
            )}
        </div>
    );
};

export default OrderView;