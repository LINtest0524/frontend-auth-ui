import AuditLogTable from "@/components/AuditLogTable";

export default function PortalActionLogPage() {
  return (
    <AuditLogTable
      keyword="前台操作:"
      title="前台操作紀錄"
    />
  );
}
