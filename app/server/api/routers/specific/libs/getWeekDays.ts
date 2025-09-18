import dayId2dayIdWithPad from '@root/app/lib/date/dayId2dayIdWithPad';
import dayIdParser from '@root/app/server/api/routers/specific/libs/dayIdParser';
import { startOfWeek, addDays } from 'date-fns';

const getWeekDays = (day: string): string[] => {
    const parsedDay = dayIdParser(day, 1); // monthIndexStart = 1 because input is in yyyy-MM-dd format

    // Create Date object from parsed day
    const inputDate = new Date(parsedDay.year, parsedDay.month + 1, parsedDay.day);

    // Get start of week (Monday)
    const startOfWeekDate = startOfWeek(inputDate, { weekStartsOn: 1 });

    // Generate array of all 7 days of the week
    const weekDays: string[] = [];
    for (let i = 0; i < 7; i++) {
        const currentDay = addDays(startOfWeekDate, i);
        const formattedDay = `${currentDay.getFullYear()}-${currentDay.getMonth()}-${currentDay.getDate()}`;
        const withPad = dayId2dayIdWithPad(formattedDay);
        weekDays.push(withPad);
    }

    return weekDays;
};

export default getWeekDays;