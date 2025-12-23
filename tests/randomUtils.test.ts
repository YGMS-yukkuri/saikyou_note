import { describe, it, expect } from 'vitest'
import { pickRandomNotInSet } from '../src/lib/randomUtils'

describe('pickRandomNotInSet', () => {
  it('returns null when all seen', () => {
    expect(pickRandomNotInSet(3, new Set([0,1,2]))).toBeNull()
  })

  it('returns index not in set', () => {
    const v = pickRandomNotInSet(5, new Set([0,1]))
    expect(v).not.toBeNull()
    expect([2,3,4]).toContain(v)
  })
})