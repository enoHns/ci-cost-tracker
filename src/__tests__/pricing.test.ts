import { getPricing } from '../pricing'

describe('getPricing', () => {
  it('returns correct GitHub ubuntu price', () => {
    const p = getPricing('github', 'ubuntu-latest')
    expect(p.pricePerMinute).toBe(0.008)
    expect(p.currency).toBe('USD')
  })

  it('returns higher price for macOS', () => {
    const linux = getPricing('github', 'ubuntu-latest')
    const mac   = getPricing('github', 'macos-latest')
    expect(mac.pricePerMinute).toBeGreaterThan(linux.pricePerMinute)
  })

  it('falls back to default for unknown runner', () => {
    const p = getPricing('aws', 'some-unknown-runner')
    expect(p.pricePerMinute).toBeGreaterThan(0)
    expect(p.currency).toBe('USD')
  })

  it('returns GCP pricing', () => {
    const p = getPricing('gcp', 'N1_HIGHCPU_8')
    expect(p.pricePerMinute).toBeCloseTo(0.0034)
  })

  it('windows costs more than linux on GitHub', () => {
    const linux   = getPricing('github', 'ubuntu-latest')
    const windows = getPricing('github', 'windows-latest')
    expect(windows.pricePerMinute).toBeGreaterThan(linux.pricePerMinute)
  })
})
