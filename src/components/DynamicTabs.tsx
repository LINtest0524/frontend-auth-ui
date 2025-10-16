// components/DynamicTabs.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTabsStore } from "@/hooks/use-tabs-store";
import { cn } from "@/lib/utils";

export default function DynamicTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const { tabs, activeTab, removeTab, setActiveTab, clearTabs } = useTabsStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; show: boolean }>({
    x: 0,
    y: 0,
    show: false
  });

  // 當路由變化時，更新活躍頁籤
  useEffect(() => {
    if (pathname && pathname !== activeTab) {
      setActiveTab(pathname);
    }
  }, [pathname, activeTab, setActiveTab]);

  const handleTabClick = (path: string) => {
    setActiveTab(path);
    router.push(path);
  };

  const handleTabClose = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 如果關閉的是當前頁籤，需要先導向其他頁籤
    if (path === activeTab) {
      const currentIndex = tabs.findIndex(tab => tab.path === path);
      let targetPath = "/dashboard";
      
      if (currentIndex > 0) {
        // 優先切換到前一個頁籤
        targetPath = tabs[currentIndex - 1].path;
      } else if (currentIndex < tabs.length - 1) {
        // 否則切換到後一個頁籤
        targetPath = tabs[currentIndex + 1].path;
      }
      
      router.push(targetPath);
    }
    
    removeTab(path);
  };

  // 處理右鍵選單
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      show: true
    });
  };

  // 關閉所有頁籤
  const handleCloseAllTabs = () => {
    clearTabs();
    router.push("/dashboard");
    setContextMenu({ x: 0, y: 0, show: false });
  };

  // 點擊其他地方關閉選單
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu({ x: 0, y: 0, show: false });
    };

    if (contextMenu.show) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.show]);

  if (tabs.length <= 1) {
    return null; // 只有首頁時不顯示頁籤
  }

  return (
    <>
      <div className="dynamic-tabs-container" onContextMenu={handleContextMenu}>
        <div className="dynamic-tabs-wrapper">
          {tabs.map((tab) => (
            <div
              key={tab.path}
              className={cn(
                "dynamic-tab",
                activeTab === tab.path && "active"
              )}
              onClick={() => handleTabClick(tab.path)}
            >
              <span className="tab-title">{tab.title}</span>
              {tab.closable && (
                <button
                  className="tab-close-btn"
                  onClick={(e) => handleTabClose(tab.path, e)}
                  title="關閉頁籤"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 右鍵選單 */}
      {contextMenu.show && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000
          }}
        >
          <div className="context-menu-item" onClick={handleCloseAllTabs}>
            關閉所有頁籤
          </div>
        </div>
      )}
    </>
  );
}