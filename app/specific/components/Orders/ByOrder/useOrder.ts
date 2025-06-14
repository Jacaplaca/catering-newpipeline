import { type UpdateMessageType } from '@root/app/hooks/useMessage';
import getCurrentTime from '@root/app/lib/date/getCurrentTime';
import { getNextWorkingDay, isWeekend } from '@root/app/specific/lib/dayInfo';
import getDeadlinesStatus from '@root/app/specific/lib/getDeadlinesStatus';
import { api } from '@root/app/trpc/react';
import { MealType, type OrderForEdit, type OrdersCustomTable } from '@root/types/specific';
import { type Session } from 'next-auth';
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

const defaultStandards = {
    breakfast: 0,
    lunch: 0,
    dinner: 0,
}

const defaultDiet = {
    breakfast: [],
    lunch: [],
    dinner: [],
} as { breakfast: string[], lunch: string[], dinner: string[] };

const useOrder = ({ orderForEdit, setRows, session, updateMessage, newOrder, clientId, addOrderClose }: {
    orderForEdit?: OrderForEdit,
    newOrder: boolean,
    setRows: Dispatch<SetStateAction<OrdersCustomTable[]>>,
    session: Session | null,
    dictionary: Record<string, string>,
    updateMessage: UpdateMessageType,
    resetMessage: () => void,
    clientId?: string,
    addOrderClose: () => void,
}) => {
    const isClient = session?.user.roleId === 'client';
    const utils = api.useUtils();
    const [error, setError] = useState<string | null>(null);
    const [day, setDay] = useState<{ year: number, month: number, day: number } | null>(null);
    const [consumersPickerOpen, setConsumersPickerOpen] = useState<MealType | null>(null);

    const [standards, setStandards] = useState(defaultStandards);
    const [diet, setDiet] = useState(defaultDiet);
    const [hideNewOrder, setHideNewOrder] = useState(false);
    const [notes, setNotes] = useState('');

    const updateNote = (value: string) => {
        setNotes(value);
        resetError();
    }

    useEffect(() => {
        if (orderForEdit) {
            setStandards(orderForEdit.standards);
            setDiet(orderForEdit.diet);
            setDay(orderForEdit.day);
            setNotes(orderForEdit.notes ?? '');
        }
    }, [orderForEdit]);

    const resetError = () => {

        setError(null);
    }

    const resetOrder = () => {
        setStandards(orderForEdit?.standards ?? defaultStandards);
        setDiet(orderForEdit?.diet ?? defaultDiet);
        setNotes(orderForEdit?.notes ?? '');
        // setDay(orderForEdit?.day ?? null);
        resetError();
    }


    const updateStandards = (meal: MealType, value: number) => {
        setStandards(prev => ({ ...prev, [meal]: Math.max(0, value) }));
        resetError();
    }

    const updateDiet = (meal: MealType, value: string[]) => {
        setDiet(prev => ({ ...prev, [meal]: value }));
        resetError();
    }

    const updateDay = (value: { year: number, month: number, day: number }) => {
        setDay(value);
        resetError();
    }

    const copyDietsFrom = (meal: MealType) => {
        resetError();
        if (meal === MealType.Lunch) {
            setDiet(prev => ({ ...prev, lunch: prev.breakfast }));
        } else if (meal === MealType.Dinner) {
            setDiet(prev => ({ ...prev, dinner: prev.lunch }));
        }
    }

    const copyStandardsFrom = (meal: MealType) => {
        resetError();
        if (meal === MealType.Lunch) {
            setStandards(prev => ({ ...prev, lunch: prev.breakfast }));
        } else if (meal === MealType.Dinner) {
            setStandards(prev => ({ ...prev, dinner: prev.lunch }));
        }
    }

    const { data: cateringSettings } = api.specific.settings.deadlines.useQuery({ clientId: clientId ?? '' }, { enabled: isClient && !!clientId });
    const { data: orderedDates } = api.specific.order.orderedDates.useQuery({ clientId: clientId ?? '' }, { enabled: isClient && !!clientId });
    const { data: lastOrder } = api.specific.order.last.useQuery({ clientId: clientId ?? '' }, { enabled: newOrder && isClient && !!clientId });

    const getNextDay = () => {
        const today = getCurrentTime();
        today.setHours(0, 0, 0, 0);
        const currentDate = new Date(today);

        if (!cateringSettings?.timeZone) return;

        const nextWorkingDay = getNextWorkingDay(currentDate, cateringSettings);
        return {
            year: nextWorkingDay.getFullYear(),
            month: nextWorkingDay.getMonth(),
            day: nextWorkingDay.getDate()
        }
    }

    useEffect(() => {
        if (lastOrder && newOrder) {
            const { standards, diet } = lastOrder;
            setStandards(standards);
            setDiet(diet);
        }
    }, [lastOrder, newOrder]);

    useEffect(() => {
        if (orderedDates && cateringSettings?.timeZone) {
            const nextDay = getNextDay();
            const currentTime = getCurrentTime();
            const isWeekendDay = isWeekend(currentTime, { timeZone: cateringSettings?.timeZone });
            if (isWeekendDay && !cateringSettings.allowWeekendOrder) {
                setHideNewOrder(true);
            } else if (nextDay) {
                const nextDayString = `${nextDay.year}-${String(nextDay.month + 1).padStart(2, '0')}-${String(nextDay.day).padStart(2, '0')}`;
                // console.log({ nextDayString });
                console.log({ nextDayString, orderedDates });
                setHideNewOrder(orderedDates.includes(nextDayString));
            } else {
                setHideNewOrder(false);
            }
        }
    }, [orderedDates, cateringSettings]);

    const getNextAvailableDate = () => {
        const nextDay = getNextDay();

        if (!nextDay) { return }

        setDay(nextDay);
    }

    const clearOrder = () => {
        getNextAvailableDate();
    }

    const deadlines = getDeadlinesStatus({ settings: cateringSettings, day });

    const updateRow = async (id: string) => {
        const updatedOrder = await utils.specific.order.forTable.fetch({ id });
        if (updatedOrder) {
            setRows(prev => prev.map(row => row.id === updatedOrder.id ? updatedOrder : row));
            await utils.specific.order.forEdit.invalidate({ id });
            await utils.specific.order.orderedDates.refetch();
        }
    }

    const saveDraft = api.specific.order.saveDraft.useMutation({

        onSuccess: async () => {
            if (orderForEdit) {
                await updateRow(orderForEdit.id);
            } else {
                await utils.specific.order.table.refetch();
                await utils.specific.order.count.refetch();
            }
            updateMessage('saved');
            resetError();
        },

        onError: (error) => {
            setError(error.message);
        },
    });

    const place = api.specific.order.place.useMutation({
        onSuccess: async () => {
            if (orderForEdit) {
                await updateRow(orderForEdit.id);
            } else {
                await utils.specific.order.orderedDates.refetch();
                await utils.specific.order.table.refetch();
                await utils.specific.order.count.refetch();
            }
            updateMessage('saved');
            resetError();
            addOrderClose();
        },

        onError: (error) => {
            setError(error.message);
            addOrderClose();
        },
    });

    const order = {
        standards,
        diet,
        day: day ?? { year: 0, month: 0, day: 0 },
        id: orderForEdit?.id,
        clientId: clientId ?? '',
        notes,
    }


    const onSubmitDraft = () => {
        saveDraft.mutate(order);
        updateMessage('saving');
    };

    const onSubmitPlace = () => {
        place.mutate(order);
        updateMessage('saving');
    };

    return {

        standards,
        diet,
        day,
        updateStandards,
        updateDiet,
        updateDay,
        copyDietsFrom,
        copyStandardsFrom,
        deadlines,
        settings: cateringSettings,
        onSubmitDraft,
        savingDraft: saveDraft.isPending,
        reset: resetOrder,
        onSubmitPlace,
        placing: place.isPending,
        error,
        hideNewOrder,
        orderedDates,
        clearOrder,
        consumerPicker: {
            open: consumersPickerOpen,
            setOpen: setConsumersPickerOpen,
            close: () => setConsumersPickerOpen(null),
        },
        lastOrder,
        notes,
        updateNote,
    }



}

export default useOrder;