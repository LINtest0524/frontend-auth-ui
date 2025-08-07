import AuditLogTable from "@/components/AuditLogTable";

export default function PortalLoginLogPage() {
  return (
    <AuditLogTable
      keyword="登入代理商"
      title="🧑‍💻 前台登入紀錄"
      target="login-portal" // ✅ 包含所有前台登入紀錄（一般登入和Facebook登入都使用此格式）
    />
  );
}
