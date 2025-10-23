/**
 * 前端時間處理工具 - 統一處理台灣時區
 * 
 * 這個模組提供一致的時間格式化和轉換功能，解決專案中時間格式不統一的問題。
 * 
 * 主要功能：
 * - 統一的24小時制顯示格式
 * - 台灣時區的自動處理
 * - 表單輸入與後端API的時間格式轉換
 * - 相對時間顯示
 * 
 * 使用方式：
 * ```typescript
 * import { toTaiwanDisplayTime, toTaiwanDatetimeString } from '@/lib/timeUtils';
 * 
 * // 顯示用
 * const displayTime = toTaiwanDisplayTime(apiData.createdAt);
 * 
 * // 表單輸入用
 * const formValue = toTaiwanDatetimeString(apiData.startDate);
 * ```
 */
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
 * 將 UTC 時間轉換為台灣時間顯示格式（24小時制）
 */
export const toTaiwanDisplayTime = (date: string | Date): string => {
  if (!date) return ''
  return dayjs(date).tz(TAIWAN_TIMEZONE).format('YYYY-MM-DD HH:mm:ss')
}

/**
 * 將 UTC 時間轉換為台灣時間顯示格式（不含秒）
 */
export const toTaiwanDisplayTimeShort = (date: string | Date): string => {
  if (!date) return ''
  return dayjs(date).tz(TAIWAN_TIMEZONE).format('YYYY-MM-DD HH:mm')
}

/**
 * 將 UTC 時間轉換為台灣時間顯示格式（僅日期）
 */
export const toTaiwanDisplayDate = (date: string | Date): string => {
  if (!date) return ''
  return dayjs(date).tz(TAIWAN_TIMEZONE).format('YYYY-MM-DD')
}

/**
 * 將 UTC 時間轉換為台灣時間顯示格式（僅時間）
 */
export const toTaiwanDisplayOnlyTime = (date: string | Date): string => {
  if (!date) return ''
  return dayjs(date).tz(TAIWAN_TIMEZONE).format('HH:mm:ss')
}

/**
 * 將 UTC 時間轉換為台灣時間的 datetime-local 格式（用於 input）
 */
export const toTaiwanDatetimeString = (date: string | Date): string => {
  if (!date) return ''
  return dayjs(date).tz(TAIWAN_TIMEZONE).format('YYYY-MM-DDTHH:mm')
}

/**
 * 將本地 datetime-local 格式轉換為 UTC ISO 字串（用於提交到後端）
 */
export const fromDatetimeLocalToUTC = (datetimeLocal: string): string => {
  if (!datetimeLocal) return ''
  return dayjs.tz(datetimeLocal, TAIWAN_TIMEZONE).toISOString()
}

/**
 * 格式化活動期間顯示（專用）
 */
export const formatActivityPeriod = (startDate: string | Date, endDate: string | Date): string => {
  if (!startDate || !endDate) return ''
  const start = toTaiwanDisplayTime(startDate)
  const end = toTaiwanDisplayTime(endDate)
  return `開始：${start}\n結束：${end}`
}

/**
 * 格式化為相對時間（多久前）
 */
export const formatRelativeTime = (date: string | Date): string => {
  if (!date) return ''
  const now = dayjs().tz(TAIWAN_TIMEZONE)
  const target = dayjs(date).tz(TAIWAN_TIMEZONE)
  const diffMinutes = now.diff(target, 'minute')
  const diffHours = now.diff(target, 'hour')
  const diffDays = now.diff(target, 'day')
  
  if (diffMinutes < 1) return '剛剛'
  if (diffMinutes < 60) return `${diffMinutes}分鐘前`
  if (diffHours < 24) return `${diffHours}小時前`
  if (diffDays < 7) return `${diffDays}天前`
  
  return toTaiwanDisplayDate(date)
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