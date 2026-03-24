import { describe, expect, it } from 'vitest'
import { buildQuery, isAbortError } from '../client'

describe('api client helpers', () => {
  it('builds query string and skips empty values', () => {
    expect(buildQuery({ page: 1, q: 'orbit manager', status: '', teamId: undefined })).toBe(
      '?page=1&q=orbit%20manager',
    )
  })

  it('returns empty string for empty query', () => {
    expect(buildQuery({ page: undefined, q: '' })).toBe('')
  })

  it('detects abort errors', () => {
    expect(isAbortError({ name: 'AbortError' })).toBe(true)
    expect(isAbortError(new Error('boom'))).toBe(false)
    expect(isAbortError(null)).toBe(false)
    expect(isAbortError('AbortError')).toBe(false)
  })
})
