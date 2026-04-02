import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

export const formatTime = (totalSeconds: number) => {
    return dayjs.unix(totalSeconds).utc().format('HH:mm:ss')
}
