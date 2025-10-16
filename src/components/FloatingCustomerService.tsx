"use client";

import { useState, useEffect, useCallback } from "react";

interface ContactInfo {
  id: number;
  title: string;
  icon?: string;
  link?: string;
  targetBlank: boolean;
  qrCode?: string;
  sortOrder: number;
  status: string;
}

interface FloatingCustomerServiceProps {
  companyCode: string;
}

export default function FloatingCustomerService({ companyCode }: FloatingCustomerServiceProps) {
  const [contactInfos, setContactInfos] = useState<ContactInfo[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchContactInfos = useCallback(async () => {
    setLoading(prev => {
      if (prev) return prev; // 如果已經在loading，直接返回
      return true;
    });
    
    try {
      const res = await fetch(`http://localhost:3001/contact-info/public/active?company=${companyCode}`);
      
      if (res.ok) {
        const data = await res.json();
        setContactInfos(data);
      } else {
        console.error("Failed to fetch contact infos");
      }
    } catch (err) {
      console.error("Fetch contact infos failed", err);
    } finally {
      setLoading(false);
    }
  }, [companyCode]);

  const handleContactClick = (item: ContactInfo) => {
    if (item.link) {
      if (item.targetBlank) {
        window.open(item.link, '_blank');
      } else {
        window.location.href = item.link;
      }
    }
    setIsExpanded(false);
  };

  const toggleExpanded = () => {
    if (!isExpanded && contactInfos.length === 0 && !loading) {
      fetchContactInfos();
    }
    setIsExpanded(!isExpanded);
  };

  // 組件載入時就嘗試獲取聯絡資訊
  useEffect(() => {
    fetchContactInfos();
  }, [companyCode]);


  // 暫時註解掉隱藏邏輯，用於測試
  // if (contactInfos.length === 0 && !loading && !isExpanded) {
  //   return null;
  // }

  return (
    <>
      {/* 浮動客服按鈕 */}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 1000,
        }}
      >
        {/* 展開的聯絡方式列表 */}
        {isExpanded && (
          <div
            style={{
              position: "absolute",
              bottom: "70px",
              right: "0",
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
              border: "1px solid #e5e7eb",
              minWidth: "280px",
              maxWidth: "320px",
              overflow: "hidden",
              animation: "slideUp 0.3s ease-out",
            }}
          >
            {/* 標題 */}
            <div
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                color: "white",
                padding: "16px 20px",
                fontWeight: "600",
                fontSize: "16px",
                textAlign: "center",
              }}
            >
              📞 聯絡我們
            </div>

            {/* 聯絡方式列表 */}
            <div style={{ padding: "8px 0" }}>
              {loading ? (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  ⏳ 載入中...
                </div>
              ) : contactInfos.length === 0 ? (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  目前沒有可用的聯絡方式
                </div>
              ) : (
                contactInfos.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleContactClick(item)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "12px 20px",
                      cursor: item.link ? "pointer" : "default",
                      transition: "all 0.2s ease",
                      borderBottom: "1px solid #f3f4f6",
                    }}
                    onMouseEnter={(e) => {
                      if (item.link) {
                        e.currentTarget.style.background = "#f8fafc";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {/* ICON */}
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        background: item.icon ? "transparent" : "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "12px",
                        overflow: "hidden",
                      }}
                    >
                      {item.icon ? (
                        <img
                          src={`http://localhost:3001${item.icon}`}
                          alt={item.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "10px",
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: "20px" }}>📞</span>
                      )}
                    </div>

                    {/* 內容 */}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: "600",
                          color: "#374151",
                          fontSize: "14px",
                          marginBottom: "2px",
                        }}
                      >
                        {item.title}
                      </div>
                      {item.link && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          點擊聯絡
                        </div>
                      )}
                    </div>

                    {/* QR Code 預覽 */}
                    {item.qrCode && (
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "6px",
                          overflow: "hidden",
                          marginLeft: "8px",
                        }}
                      >
                        <img
                          src={`http://localhost:3001${item.qrCode}`}
                          alt="QR Code"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    )}

                    {/* 外部連結圖示 */}
                    {item.link && item.targetBlank && (
                      <div
                        style={{
                          marginLeft: "8px",
                          fontSize: "12px",
                          color: "#6b7280",
                        }}
                      >
                        ↗️
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 主按鈕 */}
        <button
          onClick={toggleExpanded}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: isExpanded
              ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
              : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            border: "none",
            color: "white",
            fontSize: "24px",
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(59, 130, 246, 0.4)",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow = "0 8px 25px rgba(59, 130, 246, 0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.4)";
          }}
        >
          {isExpanded ? "✕" : "💬"}
        </button>
      </div>

      {/* 動畫樣式 */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}