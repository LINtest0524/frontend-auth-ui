import AuditLogTable from "@/components/AuditLogTable";

export default function BackActionLogPage() {
  return (
    <AuditLogTable
      keyword="操作:"
      title="📌 後管操作紀錄"
    />
  );
}
