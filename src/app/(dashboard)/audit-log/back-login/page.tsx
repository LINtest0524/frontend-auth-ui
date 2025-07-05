import AuditLogTable from "@/components/AuditLogTable";

export default function BackLoginLogPage() {
  return (
    <AuditLogTable
      keyword="登入後台"
      title="🧾 後台登入紀錄"
      target="login" // ✅ 新增：對應 login 模組紀錄
    />

  );
}
