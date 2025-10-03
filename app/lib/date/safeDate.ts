import getCurrentTime from '@root/app/lib/date/getCurrentTime';

const padZero = (num: number): string => num.toString().padStart(2, '0');

const getSafeDate = (options: { minUnit: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' } = { minUnit: 'second' }): string => {
    const now = getCurrentTime();
    const { minUnit } = options;

    const year = now.getFullYear();
    const month = padZero(now.getMonth() + 1);
    const day = padZero(now.getDate());
    const hours = padZero(now.getHours());
    const minutes = padZero(now.getMinutes());
    const seconds = padZero(now.getSeconds());

    // Build result based on minUnit
    let result = `${year}`;

    if (minUnit === 'year') return result;

    result += `-${month}`;
    if (minUnit === 'month') return result;

    result += `-${day}`;
    if (minUnit === 'day') return result;

    result += `_${hours}`;
    if (minUnit === 'hour') return result;

    result += `-${minutes}`;
    if (minUnit === 'minute') return result;

    result += `-${seconds}`;
    return result;
};

export default getSafeDate;