// 前端時間處理工具 - 統一處理台灣時區
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

// 台灣時區
const TAIWAN_TIMEZONE = 'Asia/Taipei'

/**
 * 獲取當前台灣時間的 ISO 字串
 */
export const getCurrentTaiwanTime = (): string => {
  return dayjs().tz(TAIWAN_TIMEZONE).toISOString()
}

/**
 * 獲取當前台灣時間的時間戳
 */
export const getCurrentTaiwanTimestamp = (): number => {
  return dayjs().tz(TAIWAN_TIMEZONE).valueOf()
}

/**
 * 將 UTC 時間轉換為台灣時間顯示格式
 */
export const toTaiwanDisplayTime = (date: string | Date): string => {
  return dayjs(date).tz(TAIWAN_TIMEZONE).format('YYYY/MM/DD HH:mm:ss')
}

/**
 * 將 UTC 時間轉換為台灣時間的 datetime-local 格式（用於 input）
 */
export const toTaiwanDatetimeString = (date: string | Date): string => {
  return dayjs(date).tz(TAIWAN_TIMEZONE).format('YYYY-MM-DDTHH:mm')
}

/**
 * 比較兩個時間的差異（毫秒）
 */
export const getTimeDifference = (time1: string | Date, time2: string | Date): number => {
  return dayjs(time1).valueOf() - dayjs(time2).valueOf()
}

/**
 * 檢查時間是否在指定的秒數內
 */
export const isWithinSeconds = (time: string | Date, seconds: number): boolean => {
  const now = getCurrentTaiwanTimestamp()
  const targetTime = dayjs(time).valueOf()
  return Math.abs(now - targetTime) < seconds * 1000
}

/**
 * 格式化時間差異為可讀格式
 */
export const formatTimeDifference = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}小時${minutes % 60}分鐘前`
  } else if (minutes > 0) {
    return `${minutes}分鐘前`
  } else {
    return `${seconds}秒前`
  }
}