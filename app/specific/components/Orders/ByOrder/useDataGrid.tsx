import { OrderStatus, RoleType } from '@prisma/client';
import HighlightText from '@root/app/_components/Table/HighlightText';
import SkeletonCell from '@root/app/_components/Table/SkeletonCell';
import Checkbox from '@root/app/_components/ui/Inputs/Checkbox';
import Status from '@root/app/specific/components/ui/OrderStatusSelect/Status';
import { type OrdersCustomTable } from '@root/types/specific';
import { format } from 'date-fns-tz';
import { type FC } from 'react';

const MealCount: FC<{ count: number, beforeDeadline?: number }> = ({ count, beforeDeadline }) => {
    const hasBeforeDeadline = typeof beforeDeadline === 'number';
    const hasDifference = hasBeforeDeadline && beforeDeadline !== count;

    if (!hasDifference) {
        return (
            <div
                className={`
                flex justify-center
                text-gray-900 dark:text-gray-100 font-bold text-base
                ${count ? 'opacity-100' : 'opacity-70'}
            `}
            >
                {count ? count : '-'}
            </div>
        );
    }

    const difference = count - (beforeDeadline ?? count);
    const isIncrease = difference > 0;
    const diffText = isIncrease ? `+${difference}` : `${difference}`;
    const diffColor = isIncrease
        ? 'text-green-600 dark:text-green-400'
        : 'text-red-600 dark:text-red-400';

    return (
        <div
            className={`
            flex justify-center
            text-gray-900 dark:text-gray-100 font-bold text-base
            opacity-100
        `}
        >
            <div className="flex flex-row items-center gap-3">
                <span>{count}</span>
                <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600" />
                <span className={`text-sm font-semibold ${diffColor}`}>{diffText}</span>
            </div>
        </div>
    );
}

const useOrderDataGrid = ({
    rows,
    idsChecked,
    toggleCheck,
    searchValue,
    limit,
    totalCount,
    columns,
    dictionary,
    roleId
}: {
    rows: OrdersCustomTable[]
    idsChecked: string[]
    toggleCheck: (id: string) => void
    searchValue: string,
    limit: number,
    totalCount: number,
    columns: { key: string }[],
    dictionary: Record<string, string>,
    roleId?: RoleType
}) => {

    const skeletonRowsCount = limit > totalCount ? totalCount : limit
    const skeleton = Array.from({ length: skeletonRowsCount }, (_, i) => {
        return {
            key: `skeleton-${i}`,
            rows: [
                {
                    component: <Checkbox
                        id="checkbox-table-search-1"
                        name="checkbox-table-search-1"
                        checked={false}
                        skeleton
                        onChange={() => { return void 0 }}
                    />,
                    className: "p-1 md:p-4 w-6 border-l-2 border-red-500"
                },
                ...columns.map(({ key }) => {
                    return {
                        component: <SkeletonCell />,
                        key
                    }
                })
            ]
        }
    })

    // const getMealDeltaClass = (count?: number, before?: number) => {
    //     if (typeof before !== 'number') return '';
    //     if (typeof count !== 'number') return '';
    //     if (count === before) return '';
    //     if (count < before) {
    //         return "relative after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-0 after:h-0 after:border-b-[10px] after:border-l-[10px] after:border-b-red-500 after:border-l-transparent";
    //     }
    //     return "relative after:content-[''] after:absolute after:top-0 after:left-0 after:w-0 after:h-0 after:border-t-[10px] after:border-r-[10px] after:border-t-green-500 after:border-r-transparent";
    // }

    const table = rows.map(({ id, client, deliveryDay, status, breakfastStandard,
        lunchStandard, dinnerStandard, breakfastDietCount, lunchDietCount,
        dinnerDietCount, sentToCateringAt, isChanged,
        lunchStandardBeforeDeadline, dinnerStandardBeforeDeadline,
        lunchDietCountBeforeDeadline, dinnerDietCountBeforeDeadline
    }, i) => {
        const isDraft = status === OrderStatus.draft;
        const isClient = roleId === RoleType.client;
        const isDietician = roleId === RoleType.dietician;
        const disableMainCheckbox = !isDraft && (isClient || isDietician);
        const deliveryDayDate = new Date(deliveryDay?.year ?? 0,
            deliveryDay?.month ?? 0,
            deliveryDay?.day ?? 0);
        const classNameChanged = "relative after:content-[''] after:absolute after:inset-y-0 after:left-0 after:w-1 after:bg-yellow-500"
        return {
            key: id ?? `placeholderData-${i}`,
            rows: [
                {
                    component: <Checkbox
                        id="checkbox-table-search-1"
                        name="checkbox-table-search-1"
                        checked={idsChecked.includes(id)}
                        onChange={() => toggleCheck(id)}
                        disabled={disableMainCheckbox}
                        className={`${disableMainCheckbox ? "opacity-50" : ""}`}
                    />,
                    className: `p-1 md:p-4 w-6  
                    ${isChanged ? classNameChanged : ""}`,
                },
                {
                    component: <HighlightText
                        className="whitespace-nowrap font-medium text-gray-900 dark:text-white flex justify-center"
                        text={deliveryDayDate ? format(deliveryDayDate, 'dd-MM-yyyy') : ''}
                    />,
                    key: 'deliveryDay'
                },
                {
                    component: <Status status={status} dictionary={dictionary} />,
                    key: 'status'
                },
                {
                    component: <HighlightText
                        className="whitespace-nowrap font-medium text-gray-900 dark:text-white"
                        text={client?.name ?? ""}
                        fragment={searchValue} />,
                    key: 'client.name'
                },
                {
                    component: <HighlightText
                        className="whitespace-nowrap font-medium text-gray-900 dark:text-white"
                        text={client?.code ?? ""}
                        fragment={searchValue} />,
                    key: 'client.code'
                },
                {
                    component: <MealCount count={breakfastStandard} />,
                    key: 'breakfastStandard',
                },
                {
                    component: <MealCount
                        count={lunchStandard}
                        beforeDeadline={lunchStandardBeforeDeadline}
                    />,
                    key: 'lunchStandard',
                    // className: `${getMealDeltaClass(lunchStandard, lunchStandardBeforeDeadline)}`
                },
                {
                    component: <MealCount
                        count={dinnerStandard}
                        beforeDeadline={dinnerStandardBeforeDeadline}
                    />,
                    key: 'dinnerStandard',
                    // className: `${getMealDeltaClass(dinnerStandard, dinnerStandardBeforeDeadline)}`
                },
                {
                    component: <MealCount count={breakfastDietCount} />,
                    key: 'breakfastDietCount'
                },
                {
                    component: <MealCount
                        count={lunchDietCount}
                        beforeDeadline={lunchDietCountBeforeDeadline}
                    />,
                    key: 'lunchDietCount',
                    // className: `${getMealDeltaClass(lunchDietCount, lunchDietCountBeforeDeadline)}`
                },
                {
                    component: <MealCount
                        count={dinnerDietCount}
                        beforeDeadline={dinnerDietCountBeforeDeadline}
                    />,
                    key: 'dinnerDietCount',
                    // className: `${getMealDeltaClass(dinnerDietCount, dinnerDietCountBeforeDeadline)}`
                },
                {
                    component: <HighlightText
                        className="whitespace-nowrap font-medium text-gray-900 dark:text-white flex justify-center"
                        text={sentToCateringAt?.$date ? format(sentToCateringAt.$date, 'dd-MM-yyyy HH:mm') : ''}
                    />,
                    key: 'sentToCateringAt'
                },
            ]
        }
    });

    return { skeleton, table }

}

export default useOrderDataGrid;