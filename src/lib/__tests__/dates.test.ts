import { getDistinctWeeksInMonth, toIsoWeekNumber } from '../date';
import { test, expect } from 'vitest';

test('converts a date to ISO week', () => {
    const date = new Date(2024, 9, 1);

    const week = toIsoWeekNumber(date);

    expect(week).toBe(40);
});

test('calculates that October has 5 weeks', () => {
    const date = new Date(2024, 9, 1);

    const weeks = getDistinctWeeksInMonth(date);

    expect(weeks).toEqual([40, 41, 42, 43, 44]);
});