import AuditLogTable from '@/components/AuditLogTable'

export default function BackBlacklistLogPage() {
  return (
    <AuditLogTable
      keyword="黑名單" //   保留這行，過濾用
      title="黑名單 操作紀錄"
      target="blacklist" //   改成這個
    />
  )
}
