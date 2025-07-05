import AuditLogTable from "@/components/AuditLogTable";

export default function BackActionLogPage() {
  return (
    <AuditLogTable
      keyword="新增 Banner" // 新增 Banner這幾個字 都不能改動 一旦改動前台渲染會失敗
      title="📌 後台 Banner 操作紀錄"
    />
  );
}

