import AuditLogTable from '@/components/AuditLogTable'

export default function BackBlacklistLogPage() {
  return (
    <AuditLogTable
      keyword="黑名單"
      title="📌 黑名單 操作紀錄"
    />
  )
}
