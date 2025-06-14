export const isWeekend = (date: Date, { timeZone }: { timeZone: string }): boolean => {
    const options = { timeZone, weekday: 'long' } as const;
    const formatter = new Intl.DateTimeFormat('en-GB', options);
    const dayOfWeek = formatter.format(date);
    return dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';
};

export const isWorkingDay = (date: Date, { timeZone, nonWorkingDays }: { timeZone: string, nonWorkingDays?: string[] }): boolean => {
    if (nonWorkingDays && nonWorkingDays.length > 0) {
        // Format the input date to 'YYYY-MM-DD' string in the specified timeZone
        const dateStringFormatter = new Intl.DateTimeFormat('sv-SE', { timeZone });
        const formattedDate = dateStringFormatter.format(date);

        if (nonWorkingDays.includes(formattedDate)) {
            return false; // It's a non-working day based on the provided list
        }
    }

    if (isWeekend(date, { timeZone })) {
        return false; // It's a weekend
    }

    return true; // It's a working day
};

export const getNextWorkingDay = (
    startDate: Date = new Date(),
    { timeZone, nonWorkingDays }: { timeZone: string, nonWorkingDays?: string[] }
): Date => {
    const nextDate = new Date(startDate.getTime());
    // Increment date by one day to ensure the returned day is in the future
    nextDate.setDate(nextDate.getDate() + 1);

    // Loop until a working day is found
    while (!isWorkingDay(nextDate, { timeZone, nonWorkingDays })) {
        nextDate.setDate(nextDate.getDate() + 1);
    }
    return nextDate;
}