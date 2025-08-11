
import AuditLogTable from "@/components/AuditLogTable";

export default function AdminUserAuditPage() {
  return (
    <AuditLogTable
      keyword="後台使用者"
      title="管理員操作紀錄"
      target="admin-user"
    />
  );
}
