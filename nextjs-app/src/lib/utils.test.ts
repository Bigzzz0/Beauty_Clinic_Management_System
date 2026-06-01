import { formatCurrency, generateHNCode } from './utils'

describe('Utils', () => {
  it('formats currency correctly', () => {
    const result = formatCurrency(1500)
    expect(result).toContain('1,500')
    expect(result).toContain('฿')
  })

  it('generates HN code correctly', () => {
    const hn1 = generateHNCode()
    const hn2 = generateHNCode()
    
    expect(hn1.startsWith('HN')).toBe(true)
    expect(Object.is(hn1, hn2)).toBe(false)
  })
})
