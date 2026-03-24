import { describe, expect, it } from 'vitest'
import {
  formatLocalDateInput,
  formatLocalTimeInput,
  getLocalMonthRangeIso,
  isSameLocalDate,
  toLocalDateTimeIso,
  toLocalEndOfDayIso,
} from '../dateTime'

describe('dateTime utils', () => {
  it('builds datetime iso in UTC without local offset shift', () => {
    expect(toLocalDateTimeIso('2026-03-23', '10:15')).toBe('2026-03-23T10:15:00.000Z')
  })

  it('builds end-of-day iso in UTC', () => {
    expect(toLocalEndOfDayIso('2026-03-23')).toBe('2026-03-23T23:59:59.999Z')
  })

  it('throws for invalid date inputs', () => {
    expect(() => toLocalDateTimeIso('', '10:15')).toThrowError('Invalid date format: ""')
    expect(() => toLocalDateTimeIso('2026-13-45', '10:15')).toThrowError(
      'Invalid date format: "2026-13-45"',
    )
    expect(() => toLocalDateTimeIso('not-a-date', '10:15')).toThrowError(
      'Invalid date format: "not-a-date"',
    )
    expect(() => toLocalEndOfDayIso('not-a-date')).toThrowError('Invalid date format: "not-a-date"')
  })

  it('returns full month UTC range', () => {
    expect(getLocalMonthRangeIso(2026, 2)).toEqual({
      from: '2026-02-01T00:00:00.000Z',
      to: '2026-02-28T23:59:59.999Z',
    })
  })

  it('formats local date and time input from Date', () => {
    const value = new Date(2026, 2, 23, 10, 15, 0, 0)
    expect(formatLocalDateInput(value)).toBe('2026-03-23')
    expect(formatLocalTimeInput(value)).toBe('10:15')
  })

  it('compares local date parts for ISO value', () => {
    expect(isSameLocalDate('2026-03-23T10:15:00.000Z', 2026, 3, 23)).toBe(true)
    expect(isSameLocalDate('2026-03-23T10:15:00.000Z', 2026, 3, 24)).toBe(false)
  })

  it('throws for invalid time inputs', () => {
    expect(() => toLocalDateTimeIso('2026-03-23', '')).toThrowError('Invalid time format: ""')
    expect(() => toLocalDateTimeIso('2026-03-23', '25:00')).toThrowError(
      'Invalid time format: "25:00"',
    )
    expect(() => toLocalDateTimeIso('2026-03-23', '12:99')).toThrowError(
      'Invalid time format: "12:99"',
    )
    expect(() => toLocalDateTimeIso('2026-03-23', '12')).toThrowError('Invalid time format: "12"')
  })
})
