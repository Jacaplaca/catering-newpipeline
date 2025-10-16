import dayObj2dayId from '@root/app/lib/date/dayObj2dayId';
import parseDate from '@root/app/lib/date/parseDate';

const date2dayObj = (date: Date) => {
    const { year, month, day } = parseDate(date);

    return dayObj2dayId({ year, month, day });

    // if (isNaN(year) || isNaN(month) || isNaN(day)) {
    //     throw new Error('Invalid day in dayId for the given month and year');
    // }

}

export default date2dayObj;