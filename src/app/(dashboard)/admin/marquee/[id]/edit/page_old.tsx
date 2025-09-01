"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditMarqueePage() {
  const { id } = useParams();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [tagId, setTagId] = useState<number | null>(null);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
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

  const fetchData = async () => {
    if (!token) {
      setError("未登入或 token 遺失，請重新登入");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/admin/marquee/item/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTitle(data.title || "");
      setContent(data.content || "");
      setLink(data.link || "");
      setIsActive(data.isActive);
      setTagId(data.tag?.id || null);
    } catch (err: any) {
      setError("資料載入失敗");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!token) {
      setError("未登入或 token 遺失，請重新登入");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/admin/marquee/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, link, isActive, tagId }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      router.push("/admin/marquee");
    } catch (err) {
      setError("儲存失敗");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
      fetchTags();
    }
  }, [id]);

  return (
    <div className="b-ibox">

      <h1>編輯跑馬燈</h1>

      {error && <p className="text-red-600 mb-2">{error}</p>}

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
              儲存修改
            </button>
          </div>

          
        </form>


      </div>
    </div>
  );
}
