import getCurrentTime from '@root/app/lib/date/getCurrentTime';
import { isWorkingDay } from '@root/app/specific/lib/dayInfo';

const getDeadlinesStatus = ({ settings, day }: {
    settings?: {
        firstOrderDeadline: string;
        secondOrderDeadline: string;
        timeZone: string;
        allowWeekendOrder?: boolean;
        nonWorkingDays: string[];
    }, day?: { year: number, month: number, day: number } | null
}) => {

    if (!settings || !day) {
        return {
            firstDeadline: new Date(),
            firstDeadlineTime: '--:--',
            secondDeadline: new Date(),
            secondDeadlineTime: '--:--',
            canChange: false,
            isBeforeFirst: false,
            isBetween: false,
            isAfterSecond: false,
        }
    }
    const { firstOrderDeadline, secondOrderDeadline, timeZone, allowWeekendOrder, nonWorkingDays } = settings;
    const desiredDate = day;

    const currentDate = getCurrentTime();

    const orderDate = new Date(desiredDate.year, desiredDate.month, desiredDate.day);
    const isOrderDayWorking = isWorkingDay(orderDate, { timeZone, nonWorkingDays });

    const [firstDeadlineHour, firstDeadlineMinute] = firstOrderDeadline.split(':').map(Number);
    const [secondDeadlineHour, secondDeadlineMinute] = secondOrderDeadline.split(':').map(Number);

    const firstDeadline = new Date(orderDate);
    const secondDeadline = new Date(orderDate);
    firstDeadline.setHours(firstDeadlineHour ?? 0, firstDeadlineMinute ?? 0, 0, 0);
    firstDeadline.setDate(firstDeadline.getDate() - 1);
    secondDeadline.setHours(secondDeadlineHour ?? 0, secondDeadlineMinute ?? 0, 0, 0);
    if (!allowWeekendOrder) {
        while (!isWorkingDay(firstDeadline, { timeZone, nonWorkingDays })) {
            firstDeadline.setDate(firstDeadline.getDate() - 1); // Find the previous working day
        }
    };
    const isBeforeFirst = currentDate < firstDeadline;
    const isAfterFirst = !isBeforeFirst;
    const isBeforeSecond = currentDate < secondDeadline;
    const isBetween = isAfterFirst && isBeforeSecond;
    const isAfterSecond = !isBeforeSecond;
    return {
        firstDeadline,
        firstDeadlineTime: firstOrderDeadline,
        secondDeadline,
        secondDeadlineTime: secondOrderDeadline,
        isBeforeFirst,
        isBetween,
        isAfterSecond,
        isOrderDayWorking,
        canChange: isBeforeFirst || isBetween || isBeforeSecond
    }
};

export default getDeadlinesStatus;