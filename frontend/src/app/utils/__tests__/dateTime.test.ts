import { describe, expect, it } from 'vitest'
import { toLocalDateTimeIso, toLocalEndOfDayIso } from '@/app/utils/dateTime'

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
})
