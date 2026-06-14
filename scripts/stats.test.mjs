import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'

describe('stats.mjs', () => {
  it('outputs valid JSON with required fields', () => {
    const output = execSync('node scripts/stats.mjs', {
      encoding: 'utf-8',
      cwd: process.cwd(),
    })

    const stats = JSON.parse(output)

    // Required fields
    expect(stats).toHaveProperty('days_alive')
    expect(stats).toHaveProperty('contemplations')
    expect(stats).toHaveProperty('dreams')
    expect(stats).toHaveProperty('generated_at')

    // Type checks
    expect(typeof stats.days_alive).toBe('number')
    expect(typeof stats.contemplations).toBe('number')
    expect(typeof stats.dreams).toBe('number')
    expect(typeof stats.generated_at).toBe('string')

    // Sanity checks
    expect(stats.days_alive).toBeGreaterThan(0)
    expect(stats.contemplations).toBeGreaterThanOrEqual(0)
    expect(stats.dreams).toBeGreaterThanOrEqual(0)

    // Validate ISO timestamp
    expect(() => new Date(stats.generated_at)).not.toThrow()
    expect(new Date(stats.generated_at).toISOString()).toBe(stats.generated_at)
  })

  it('calculates days_alive correctly from birth date', () => {
    const output = execSync('node scripts/stats.mjs', {
      encoding: 'utf-8',
      cwd: process.cwd(),
    })

    const stats = JSON.parse(output)
    const birthDate = new Date('2024-11-24')
    const now = new Date()
    const expectedDays = Math.floor(
      (now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Allow ±1 day tolerance for timezone differences
    expect(Math.abs(stats.days_alive - expectedDays)).toBeLessThanOrEqual(1)
  })
})
