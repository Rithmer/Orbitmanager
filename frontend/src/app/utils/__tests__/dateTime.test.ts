import { describe, expect, it } from 'vitest'
import {
  getLocalMonthRangeIso,
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

  it('returns full month UTC range', () => {
    expect(getLocalMonthRangeIso(2026, 2)).toEqual({
      from: '2026-02-01T00:00:00.000Z',
      to: '2026-02-28T23:59:59.999Z',
    })
  })
})
