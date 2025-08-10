"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MarqueeCreatePage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [tagId, setTagId] = useState<number | null>(null);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const userJson =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const companyId = userJson ? JSON.parse(userJson)?.company?.id : null;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchTags = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/admin/marquee-tags`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTags(data.filter((tag: any) => tag.isActive));
      }
    } catch (err) {
      console.error("載入標籤失敗:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert("請輸入標題");
    if (!companyId) return alert("找不到公司 ID，請重新登入");
    if (!token) return alert("未登入或 token 遺失，請重新登入");

    try {
      setLoading(true);

      const res = await fetch(`${apiBase}/admin/marquee`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
          link,
          isActive,
          companyId,
          tagId,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`伺服器錯誤：${res.status} - ${errText}`);
      }

      alert("新增成功！");
      router.push("/admin/marquee");
    } catch (err: any) {
      alert("新增失敗：" + err.message);
      console.error("新增失敗", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  return (
    <div className="b-ibox">

      <h1>新增跑馬燈</h1>

      <div className="b-ibox-s">

        <form onSubmit={handleSubmit} className="w100">

          <div className="b-form-group-1 w100 fl4">
            <label>標題</label>
            <input
              type="text"
              className="w70"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>


          <div className="b-form-group-1 w100 fl4">
            <label>內容</label>
            <textarea
              className="w70"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>


          <div className="b-form-group-1 w100 fl4">
            <label>連結網址</label>
            <input
              type="url"
              className="w70"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>標籤</label>
            <select
              className="w70"
              value={tagId || ""}
              onChange={(e) => setTagId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">無標籤</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
            {tagId && tags.find(t => t.id === tagId) && (
              <div style={{ marginTop: "8px" }}>
                <span
                  style={{
                    backgroundColor: tags.find(t => t.id === tagId)?.backgroundColor,
                    color: tags.find(t => t.id === tagId)?.textColor,
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "bold"
                  }}
                >
                  {tags.find(t => t.id === tagId)?.name}
                </span>
              </div>
            )}
          </div>


          <div className="b-form-group-1 w100 fl4">
            <label htmlFor="active">啟用</label>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              id="active"
              className="new-checkbox"
            />
          </div>

          

          <div className="fl4 w100 b-btnbox">
            <button
              type="submit"
              disabled={loading}
              className="b-btn-s2 b-btn-c4 mr20"
            >
              {loading ? "儲存中..." : "儲存送出"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/marquee")}
              className="b-btn-s2 b-btn-c1"
            >
              取消
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}
