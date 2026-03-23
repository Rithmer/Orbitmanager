import { describe, expect, it } from 'vitest'
import { validatePasswordPolicy } from '../passwordPolicy'

describe('passwordPolicy', () => {
  it('accepts a valid strong password', () => {
    expect(validatePasswordPolicy('SecurePass1!')).toBeNull()
  })

  it('rejects short passwords', () => {
    expect(validatePasswordPolicy('S1!a')).toContain('не менее 8')
  })

  it('rejects passwords without special symbols', () => {
    expect(validatePasswordPolicy('SecurePass1')).toBeTruthy()
  })
})
