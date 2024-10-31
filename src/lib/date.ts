export function toIsoWeekNumber(date: Date): number {
    // Get the day of week where 0 = Sunday, 1 = Monday, etc.
    const dayOfWeek = date.getDay();
    
    // Convert Sunday (0) to 7 to match ISO week calculations
    const correctedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    
    // Move date to Thursday of the same week
    // This is done by adding the number of days to reach Thursday
    // (4 - correctedDayOfWeek) handles this calculation
    const targetThursday = new Date(date);
    targetThursday.setDate(date.getDate() + (4 - correctedDayOfWeek));
    
    // Get January 1st of the target Thursday's year
    const yearStart = new Date(targetThursday.getFullYear(), 0, 1);
    
    // Calculate full weeks between yearStart and targetThursday
    const weekNumber = Math.ceil(
        (((targetThursday.getTime() - yearStart.getTime()) / 86400000) + 1) / 7
    );
    
    return weekNumber;
}

export function getDistinctWeeksInMonth(dateMax: Date): number[] {
    const days = [...Array(new Date(dateMax.getFullYear(), dateMax.getMonth(), 0).getDate()).keys()];

    const weekNumbers = days
        .map(day => {
            const date = new Date(
                dateMax.getFullYear(),
                dateMax.getMonth(),
                day + 1
            );
            return toIsoWeekNumber(date);
        })
        .filter((value, index, self) => self.indexOf(value) === index);
    
    return weekNumbers;
}