import dayjs from '@/lib/dayjs'

describe('dayjs', () => {
  it('converts a wall-clock time in a timezone to UTC', () => {
    // Arrange
    const wallClock = '2026-03-01T10:00'
    const zone = 'America/New_York'

    // Act
    const utcIso = dayjs.tz(wallClock, zone).utc().toISOString()

    // Assert
    // New York is UTC-5 on March 1, before DST starts.
    expect(utcIso).toBe('2026-03-01T15:00:00.000Z')
  })

  it('formats an ISO timestamp in another timezone', () => {
    // Arrange
    const iso = '2026-03-01T15:00:00.000Z'

    // Act
    const formatted = dayjs(iso).tz('America/New_York').format('YYYY-MM-DDTHH:mm')

    // Assert
    expect(formatted).toBe('2026-03-01T10:00')
  })
})
