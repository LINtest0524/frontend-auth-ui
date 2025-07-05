import AuditLogTable from "@/components/AuditLogTable";

export default function PortalLoginLogPage() {
  return (
    <AuditLogTable
      keyword="登入代理商"
      title="🧑‍💻 前台登入紀錄"
      target="login-portal" // ✅ 對應後端這邊補的 target
    />
  );
}
