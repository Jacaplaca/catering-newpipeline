const dayObj2dayId = (day: { year: number, month: number, day: number }) => {
    return day.year + '-' + String(day.month).padStart(2, '0') + '-' + String(day.day).padStart(2, '0');
}

export default dayObj2dayId;