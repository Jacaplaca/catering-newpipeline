import dayObj2dayId from '@root/app/lib/date/dayObj2dayId';
import dayIdParser from '@root/app/server/api/routers/specific/libs/dayIdParser';

const dayId2dayIdWithPad = (dayId: string) => {
    const { year, month, day } = dayIdParser(dayId);
    return dayObj2dayId({ year, month, day });
}

export default dayId2dayIdWithPad;