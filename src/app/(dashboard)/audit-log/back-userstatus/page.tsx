import AuditLogTable from '@/components/AuditLogTable'

export default function BackBlacklistLogPage() {
  return (
    <AuditLogTable
        keyword="會員狀態"
        title="狀態變更紀錄"
        target="status"
      />

  )
}
