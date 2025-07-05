import AuditLogTable from '@/components/AuditLogTable'

export default function BackBlacklistLogPage() {
  return (
    <AuditLogTable
      keyword="黑名單" // ❗️請勿更改，前端過濾使用
      title="📌 黑名單 操作紀錄"
      target="user" // ✅ 必加！傳給後端辨識模組類型
    />
  )
}
