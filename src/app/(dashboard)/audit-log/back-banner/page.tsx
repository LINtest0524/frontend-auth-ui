import AuditLogTable from "@/components/AuditLogTable";

export default function BackActionLogPage() {
  return (
    <AuditLogTable
      keyword="Banner"
      title="後台 Banner 操作紀錄"
      target="banner"
    />

  );
}
