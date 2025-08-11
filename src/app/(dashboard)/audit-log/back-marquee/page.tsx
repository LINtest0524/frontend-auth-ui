import AuditLogTable from "@/components/AuditLogTable";

export default function BackMarqueeLogPage() {
  return (
    <AuditLogTable
      keyword="跑馬燈" // 不要更改，關鍵字過濾用
      title="跑馬燈操作紀錄"
      target="marquee" //   傳給後端做過濾
    />
  );
}
