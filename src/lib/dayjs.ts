import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

/**
 * dayjs with the `utc` and `timezone` plugins registered.
 *
 * Interview scheduling converts wall-clock times between the device timezone
 * and a user-chosen one, which needs both plugins. Import this module (instead
 * of `dayjs`) wherever `dayjs.utc()` or `dayjs.tz()` is used so the plugins are
 * always registered exactly once.
 */
dayjs.extend(utc)
dayjs.extend(timezone)

export default dayjs
