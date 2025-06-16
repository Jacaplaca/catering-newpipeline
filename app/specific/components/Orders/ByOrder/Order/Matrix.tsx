import InputStandard from '@root/app/_components/ui/Inputs/Standard';
import Tooltip from '@root/app/_components/ui/Tooltip';
import translate from '@root/app/lib/lang/translate';
import { useOrderTableContext } from '@root/app/specific/components/Orders/ByOrder/context';
import ConsumersPicker from '@root/app/specific/components/Orders/ByOrder/Order/ConsumersPicker';
import { MealType } from '@root/types/specific';
import { type FC } from 'react';

const CopyFromButton: FC<{
    meal: MealType,
    type: 'standard' | 'diet',
    isLocked: boolean
}> = ({ meal, type, isLocked }) => {

    const {
        dictionary,
        order: {
            copyDietsFrom,
            copyStandardsFrom,
            deadlines: { isBetween }
        },
    } = useOrderTableContext();

    const hideCopy = (meal === MealType.Breakfast || (isBetween && type === 'diet'));

    const tooltipContent = meal === MealType.Lunch
        ? translate(dictionary, "orders:copy_from_breakfast")
        : translate(dictionary, "orders:copy_from_lunch");

    if (isLocked) {
        return <div
            className={`p-2 flex items-center`}>
            <i className="fa-solid fa-lock text-sm opacity-80"></i>
        </div>
    }

    return <div className={`
        ${hideCopy ? 'invisible' : ''}
        `}>
        <Tooltip content={tooltipContent} >
            <button
                className={`p-2 flex items-center`}
                onClick={() => type === 'standard'
                    ? copyStandardsFrom(meal)
                    : copyDietsFrom(meal)}
            >
                <i className="fa-solid fa-arrows-rotate text-sm opacity-80 hover:opacity-100"></i>
            </button>
        </Tooltip>
    </div>
}

export const checkIfLocked = (meal: MealType, isBetween: boolean, isAfterSecond: boolean) => {
    const isBreakfast = meal === MealType.Breakfast;
    return (isBreakfast && isBetween) || isAfterSecond;
}


const MealCell: FC<{
    meal: MealType,
    type: 'standard' | 'diet',
    onClick?: (meal: MealType) => void
}> = ({ meal, type, onClick }) => {
    const {
        dictionary,
        order: {
            standards,
            diet,
            updateStandards,
            deadlines: { isBetween, isAfterSecond }
        },
    } = useOrderTableContext();

    const isLocked = checkIfLocked(meal, isBetween, isAfterSecond);

    if (type === 'standard') {
        return <div className='flex flex-row gap-1 items-center justify-center'>
            <InputStandard
                id={`${meal}-${type}-meals-count`}
                type="number"
                onChange={(e) => {
                    updateStandards(meal, Number(e.target.value));
                }}
                className={`w-20 text-center font-semibold dark:bg-transparent
                    `}
                value={standards[meal].toString()}
                disabled={isLocked}
            />
            <CopyFromButton meal={meal} type={type} isLocked={isLocked} />
        </div>
    }

    return <div className='flex flex-row gap-1 items-center justify-center'>
        <Tooltip content={translate(dictionary, isLocked
            ? "orders:order_input_tooltip_overdue"
            : "orders:select_consumers_tooltip")} >
            <button className={`
            px-4 py-1 flex items-center font-semibold
            dark:bg-transparent bg-white
            ${isLocked
                    ? "opacity-90"
                    : "hover:dark:bg-darkmode-secondary-accent hover:bg-secondary"}
            rounded-md
            border-[1px] border-neutral-300 dark:border-neutral-600
            text-neutral-800 dark:text-neutral-200
            hover:dark:text-neutral-100 hover:text-neutral-900
            `}
                onClick={() => onClick?.(meal)}
            // disabled={isLocked}
            >
                {diet[meal].length}
            </button>
        </Tooltip>
        <CopyFromButton meal={meal} type={type} isLocked={isLocked} />
    </div>
}


const OrderMatrix: FC = () => {

    const {
        clientId,
        dictionary,
        order: {
            diet,
            updateDiet,
            consumerPicker: {
                open: consumersPickerOpen,
                setOpen: setConsumersPickerOpen,
            }
        },
    } = useOrderTableContext();

    const handleConsumerClick = (id: string | null, allItems: { id: string, name: string }[]) => {
        if (id && consumersPickerOpen) {
            updateDiet(consumersPickerOpen, diet[consumersPickerOpen].includes(id)
                ? diet[consumersPickerOpen].filter(consumerId => consumerId !== id)
                : [...diet[consumersPickerOpen], id]
            );
        }
    }



    if (consumersPickerOpen) {
        return <ConsumersPicker
            onResultClick={handleConsumerClick}
            mealType={consumersPickerOpen}
            clientId={clientId}
        />
    }

    const mealLabelClass = 'p-2 flex text-xs sm:text-sm items-center justify-end font-semibold text-neutral-800 dark:text-neutral-200';

    return (
        <div className="flex flex-col items-center justify-center">

            <div className="grid grid-cols-3 grid-rows-4 gap-2 sm:gap-4 p-2 sm:p-4 max-w-96">
                <div className="p-2 flex items-center justify-center font-semibold" />
                <div className="p-2 flex items-center justify-center font-semibold text-neutral-800 dark:text-neutral-200">
                    {translate(dictionary, "orders:standard")}
                </div>
                <div className="p-2 flex items-center justify-center font-semibold text-neutral-800 dark:text-neutral-200">
                    {translate(dictionary, "orders:diet")}
                </div>
                <div className={mealLabelClass}>
                    {translate(dictionary, "orders:breakfast")}
                </div>
                <MealCell
                    meal={MealType.Breakfast}
                    type="standard"
                />
                <MealCell
                    meal={MealType.Breakfast}
                    type="diet"
                    onClick={setConsumersPickerOpen}
                />

                <div className={mealLabelClass}>
                    {translate(dictionary, "orders:lunch")}
                </div>

                <MealCell
                    meal={MealType.Lunch}
                    type="standard"
                />
                <MealCell
                    meal={MealType.Lunch}
                    type="diet"
                    onClick={setConsumersPickerOpen}
                />

                <div className={mealLabelClass}>
                    {translate(dictionary, "orders:dinner")}
                </div>
                <MealCell
                    meal={MealType.Dinner}
                    type="standard"
                />
                <MealCell
                    meal={MealType.Dinner}
                    type="diet"
                    onClick={setConsumersPickerOpen}
                />
            </div>
        </div>
    );
};

export default OrderMatrix;