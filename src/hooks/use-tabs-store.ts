// hooks/use-tabs-store.ts
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TabItem {
  title: string;
  path: string;
  closable: boolean;
}

interface TabsStore {
  tabs: TabItem[];
  activeTab: string;
  addTab: (tab: TabItem) => void;
  removeTab: (path: string) => void;
  setActiveTab: (path: string) => void;
  clearTabs: () => void;
}

// 路由對應的頁面標題
const routeTitleMap: Record<string, string> = {
  "/dashboard": "儀錶板",
  "/admin/admin-user": "管理員管理",
  "/users": "會員管理",
  "/admin/messages": "站內信管理",
  "/admin/module": "模組設定",
  "/admin/menu": "導航管理",
  "/admin/logo": "LOGO 管理",
  "/admin/contact-info": "聯絡資訊管理",
  "/admin/ip-blacklist": "IP封鎖管理",
  "/admin/banner": "BANNER 管理",
  "/admin/marquee": "跑馬燈管理",
  "/admin/marquee-tags": "標籤管理",
  "/admin/news": "最新消息",
  "/admin/article-categories": "文章分類",
  "/admin/articles": "文章列表",
  "/admin/id-verification": "驗證通知",
  "/admin/loan-product": "產品列表",
  "/admin/loan-product/new": "新增產品",
  "/admin/product-categories": "商品分類",
  "/admin/products": "商品列表",
  "/admin/products/new": "新增商品",
  "/admin/shipping-rules": "運送規則",
  "/admin/promotion-categories": "活動分類",
  "/admin/promotions": "活動列表",
  "/admin/promotions/new": "新增活動",
  "/admin/coupons": "模板管理",
  "/admin/coupons/distribute": "發放優惠碼",
  "/admin/orders": "訂單管理",
  "/lucky-draw/prizes": "轉盤獎項列表",
  "/lucky-draw/events": "活動管理",
  "/lucky-draw/records": "抽獎記錄",
  "/admin/floating-ad": "浮動廣告管理",
  "/admin/popup-announcement": "公告列表",
  "/admin/popup-announcement/new": "新增公告",
  "/admin/maintenance": "維護管理",
  "/audit-log/admin-user": "管理員操作紀錄",
  "/audit-log/back-userstatus": "會員狀態紀錄",
  "/audit-log/back-login": "後台登入紀錄",
  "/audit-log/back-banner": "BANNER紀錄",
  "/audit-log/back-marquee": "跑馬燈紀錄",
  "/audit-log/back-blacklist": "黑名單紀錄",
  "/audit-log/portal-login": "前台登入紀錄",
  "/audit-log/portal-action": "前台操作紀錄",
  "/audit-log/balance-operations": "存扣款紀錄",
  "/audit-log/coupon-operations": "優惠券紀錄",
  // 編輯頁面
  "/admin/admin-user/new": "新增管理員",
  "/admin/banner/new": "新增BANNER",
  "/admin/banner/edit": "編輯BANNER",
  "/admin/marquee/new": "新增跑馬燈",
  "/admin/marquee-tags/new": "新增標籤",
  "/admin/news/new": "新增最新消息",
  "/admin/news/edit": "編輯最新消息",
  "/admin/articles/new": "新增文章",
  "/admin/articles/edit": "編輯文章",
  "/admin/article-categories/new": "新增文章分類",
  "/admin/product-categories/new": "新增商品分類",
  "/admin/products/edit": "編輯商品",
  "/admin/promotion-categories/new": "新增活動分類",
  "/admin/promotions/edit": "編輯活動",
  "/admin/floating-ad/new": "新增浮動廣告",
  "/admin/logo/new": "新增LOGO",
  "/admin/logo/edit": "編輯LOGO",
  "/admin/menu/new": "新增導航",
  "/admin/menu/edit": "編輯導航",
  "/lucky-draw/new": "新增抽獎",
  "/lucky-draw/events/new": "新增抽獎活動",
  "/lucky-draw/edit": "編輯抽獎",
  "/admin/coupons/cash-management": "現金管理",
  // 簽到活動路由
  "/checkin/strict-streak": "連續簽到",
  "/checkin/flex-cumulative": "累積簽到", 
  "/checkin/daily": "每日簽到",
  "/checkin/strict-streak/new": "新增連續簽到",
  "/checkin/flex-cumulative/new": "新增累積簽到",
  "/checkin/daily/new": "新增每日簽到",
  "/checkin/activities/edit": "編輯簽到活動",
  "/checkin/activities/preview": "預覽簽到活動",
};

export const useTabsStore = create<TabsStore>()(
  persist(
    (set, get) => ({
      tabs: [
        { title: "儀錶板", path: "/dashboard", closable: false }
      ],
      activeTab: "/dashboard",

      addTab: (newTab: TabItem) => {
        const { tabs } = get();
        
        // 檢查頁籤是否已存在
        const existingTab = tabs.find(tab => tab.path === newTab.path);
        if (existingTab) {
          // 如果已存在，只切換到該頁籤
          set({ activeTab: newTab.path });
          return;
        }

        // 自動從路由映射中獲取標題
        const title = routeTitleMap[newTab.path] || newTab.title;
        const tabWithTitle = { ...newTab, title };

        // 添加新頁籤
        set({
          tabs: [...tabs, tabWithTitle],
          activeTab: newTab.path
        });
      },

      removeTab: (path: string) => {
        const { tabs, activeTab } = get();
        
        // 不能關閉首頁
        if (path === "/dashboard") return;

        const newTabs = tabs.filter(tab => tab.path !== path);
        
        // 如果關閉的是當前活躍頁籤，需要切換到其他頁籤
        let newActiveTab = activeTab;
        if (activeTab === path) {
          // 切換到最後一個頁籤，如果沒有則切換到首頁
          newActiveTab = newTabs.length > 0 ? newTabs[newTabs.length - 1].path : "/dashboard";
        }

        set({
          tabs: newTabs,
          activeTab: newActiveTab
        });
      },

      setActiveTab: (path: string) => {
        set({ activeTab: path });
      },

      clearTabs: () => {
        set({
          tabs: [{ title: "儀錶板", path: "/dashboard", closable: false }],
          activeTab: "/dashboard"
        });
      }
    }),
    {
      name: "dashboard-tabs-storage",
      partialize: (state) => ({
        tabs: state.tabs,
        activeTab: state.activeTab
      })
    }
  )
);

// 導出路由標題映射，供其他組件使用
export { routeTitleMap };