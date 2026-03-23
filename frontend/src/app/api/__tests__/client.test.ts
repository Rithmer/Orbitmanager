import { describe, expect, it } from 'vitest'
import { buildQuery } from '../client'

describe('api client helpers', () => {
  it('builds query string and skips empty values', () => {
    expect(buildQuery({ page: 1, q: 'orbit manager', status: '', teamId: undefined })).toBe(
      '?page=1&q=orbit%20manager',
    )
  })
})
