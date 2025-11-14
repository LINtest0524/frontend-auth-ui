"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/hooks/use-user-store";
import { useTabsStore, routeTitleMap } from "@/hooks/use-tabs-store";
import "@/styles/components/sidebar.css";

export default function Sidebar() {
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [currentActive, setCurrentActive] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const currentUser = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const role = currentUser?.role ?? "";
  const { addTab } = useTabsStore();

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setUser(parsed);
      } catch (e) {
        console.error("無法解析 user JSON", e);
      }
    }
  }, []);

  useEffect(() => {
    if (pathname?.startsWith("/admin/companies")) setActiveMenu("companies");
    else if (pathname?.startsWith("/admin/agents")) setActiveMenu("agents");
    else if (pathname?.startsWith("/admin/marquee-tags")) setActiveMenu("tags");
    else if (pathname?.startsWith("/admin/marquee")) setActiveMenu("marquee");
    else if (pathname?.startsWith("/admin/news")) setActiveMenu("news");
    else if (pathname?.startsWith("/admin/articles")) setActiveMenu("articles");
    else if (pathname?.startsWith("/admin/article-categories")) setActiveMenu("articles");
    else if (pathname?.startsWith("/admin/products")) setActiveMenu("products");
    else if (pathname?.startsWith("/admin/product-categories")) setActiveMenu("products");
    else if (pathname?.startsWith("/admin/orders")) setActiveMenu("orders");
    else if (pathname?.startsWith("/admin/shipping-rules")) setActiveMenu("products");
    else if (pathname?.startsWith("/admin/floating-ad")) setActiveMenu("floating-ad");
    else if (pathname?.startsWith("/admin/popup-announcement")) setActiveMenu("popup-announcement");
    else if (pathname?.startsWith("/admin/menu")) setActiveMenu("website");
    else if (pathname?.startsWith("/admin/messages")) setActiveMenu("messages");
    else if (pathname?.startsWith("/admin/coupons")) setActiveMenu("coupons");
    else if (pathname?.startsWith("/admin/promotions")) setActiveMenu("promotions");
    else if (pathname?.startsWith("/admin/promotion-categories")) setActiveMenu("promotions");
    else if (pathname?.startsWith("/lucky-draw")) {
      setActiveMenu("mini-activities");
      setActiveSubMenu("lucky-draw");
    }
    else if (pathname?.startsWith("/checkin")) {
      setActiveMenu("mini-activities");
      setActiveSubMenu("checkin");
    }
    else if (pathname?.startsWith("/reports")) setActiveMenu("reports");
    else if (pathname?.startsWith("/audit-log")) setActiveMenu("audit");
    else setActiveMenu(null);
  }, [pathname]);

  const toggleMenu = (menu: string) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
    if (menu !== "mini-activities") {
      setActiveSubMenu(null); // 當切換主選單時，關閉子選單
    }
  };

  const toggleSubMenu = (subMenu: string) => {
    setActiveSubMenu((prev) => (prev === subMenu ? null : subMenu));
  };

  const resetMenu = () => {
    setCurrentActive(null);
    setActiveMenu(null);
    setActiveSubMenu(null);
  };

  const handleNavClick = (path: string) => {
    // 添加頁籤
    const title = routeTitleMap[path] || "未知頁面";
    addTab({
      title,
      path,
      closable: path !== "/dashboard" // 首頁不可關閉
    });
    resetMenu();
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={cn("sidebar-box", isCollapsed && "collapsed")}>
      <nav>
        {/* 收合按鈕 */}
        <button
          onClick={toggleCollapse}
          className="sidebar-toggle-btn"

        >
          <span className={cn("toggle-icon", isCollapsed && "collapsed")}>
            {isCollapsed ? "▶" : "◀"}
          </span>

        </button>
        
        <Link
          href="/dashboard"
          onClick={() => handleNavClick("/dashboard")}
          className={cn("sidebar-item i-dashboard", pathname === "/dashboard" && currentActive === null && "active")}
        >
          <span className="icon" />
          儀錶板
        </Link>

        {/* 公司管理 - 僅超級管理員可見 */}
        {role === "SUPER_ADMIN" && (
          <div>
            <button
              onClick={() => {
                toggleMenu("companies");
                setCurrentActive("companies");
              }}
              className={cn(
                "sidebar-item i-modules",
                currentActive === "companies" && "active",
                activeMenu === "companies" && "expanded"
              )}
            >
              <span className="icon" />
              公司管理
              <span className="i-arrow"></span>
            </button>
            <div className={cn("sidebar-submenu", activeMenu === "companies" && "open")}>
              <div className="sidebar-fd">
                <Link
                  href="/admin/companies"
                  onClick={() => handleNavClick("/admin/companies")}
                  className={cn("sidebar-subitem", pathname === "/admin/companies" && currentActive === null && "active")}
                >
                  公司列表
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 代理管理 - 超級管理員、全域管理員、代理商可見，客服不可見 */}
        {(role === "SUPER_ADMIN" || role === "GLOBAL_ADMIN" || role === "AGENT_LEVEL_1" || role === "AGENT_LEVEL_2" || role === "AGENT_LEVEL_3" || role === "AGENT_LEVEL_4") && (
          <div>
            <button
              onClick={() => {
                toggleMenu("agents");
                setCurrentActive("agents");
              }}
              className={cn(
                "sidebar-item i-log", 
                currentActive === "agents" && "active",
                activeMenu === "agents" && "expanded"
              )}
            >
              <span className="icon" />
              代理管理
              <span className="i-arrow"></span>
            </button>
            <div className={cn("sidebar-submenu", activeMenu === "agents" && "open")}>
              <div className="sidebar-fd">
                <Link
                  href="/admin/agents"
                  onClick={() => handleNavClick("/admin/agents")}
                  className={cn("sidebar-subitem", pathname === "/admin/agents" && currentActive === null && "active")}
                >
                  代理商
                </Link>
                <Link
                  href="/admin/agents/commission-condition"
                  onClick={() => handleNavClick("/admin/agents/commission-condition")}
                  className={cn("sidebar-subitem", pathname === "/admin/agents/commission-condition" && currentActive === null && "active")}
                >
                  占成條件
                </Link>
                <Link
                  href="/admin/agents/commission-calculation"
                  onClick={() => handleNavClick("/admin/agents/commission-calculation")}
                  className={cn("sidebar-subitem", pathname === "/admin/agents/commission-calculation" && currentActive === null && "active")}
                >
                  占成計算
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 管理員管理 - 超級管理員、全域管理員、代理商可見，客服不可見 */}
        {(role === "SUPER_ADMIN" || role === "GLOBAL_ADMIN" || role === "AGENT_LEVEL_1" || role === "AGENT_LEVEL_2" || role === "AGENT_LEVEL_3" || role === "AGENT_LEVEL_4") && (
          <Link
            href="/admin/admin-user"
            onClick={() => handleNavClick("/admin/admin-user")}
            className={cn("sidebar-item i-admin", pathname === "/admin/admin-user" && currentActive === null && "active")}
          >
            <span className="icon" />
            管理員管理
          </Link>
        )}

        <Link
          href="/users"
          onClick={() => handleNavClick("/users")}
          className={cn("sidebar-item i-user", pathname === "/users" && currentActive === null && "active")}
        >
          <span className="icon" />
          會員管理
        </Link>

        <Link
          href="/admin/messages"
          onClick={() => handleNavClick("/admin/messages")}
          className={cn("sidebar-item i-user", pathname === "/admin/messages" && currentActive === null && "active")}
        >
          <span className="icon" />
          站內信管理
        </Link>

        {/* 報表管理 */}
        <div>
          <button
            onClick={() => {
              toggleMenu("reports");
              setCurrentActive("reports");
            }}
            className={cn(
              "sidebar-item i-log", 
              currentActive === "reports" && "active",
              activeMenu === "reports" && "expanded"
            )}
          >
            <span className="icon" />
            報表管理
            <span className="i-arrow"></span>
          </button>
          <div className={cn("sidebar-submenu", activeMenu === "reports" && "open")}>
            <div className="sidebar-fd">
              <Link
                href="/reports/winloss"
                onClick={() => handleNavClick("/reports/winloss")}
                className={cn("sidebar-subitem", pathname === "/reports/winloss" && currentActive === null && "active")}
              >
                輸贏報表
              </Link>
            </div>
          </div>
        </div>

        {["SUPER_ADMIN", "GLOBAL_ADMIN"].includes(role) && (
          <Link
            href="/admin/module"
            onClick={() => handleNavClick("/admin/module")}
            className={cn(
              "sidebar-item i-modules",
              pathname?.startsWith("/admin/module") &&
                !pathname.includes("/marquee") &&
                currentActive === null &&
                "active"
            )}
          >
            <span className="icon" />
            模組設定
          </Link>
        )}

        {/* 網站設定 - 只有超級管理員、全域管理員、代理商老闆、一級代理商可以看到 */}
        {["SUPER_ADMIN", "GLOBAL_ADMIN", "AGENT_OWNER", "AGENT_LEVEL_1"].includes(role) && (
          <div>
            <button
              onClick={() => {
                toggleMenu("website");
                setCurrentActive("website");
              }}
              className={cn(
                "sidebar-item i-modules",
                currentActive === "website" && "active",
                activeMenu === "website" && "expanded"
              )}
            >
              <span className="icon" />
              網站設定
              <span className="i-arrow"></span>
            </button>
            <div className={cn("sidebar-submenu", activeMenu === "website" && "open")}>
              <div className="sidebar-fd">
                <Link
                  href="/admin/menu"
                  onClick={() => handleNavClick("/admin/menu")}
                  className={cn("sidebar-subitem", pathname === "/admin/menu" && currentActive === null && "active")}
                >
                  導航管理
                </Link>
                <Link
                  href="/admin/logo"
                  onClick={() => handleNavClick("/admin/logo")}
                  className={cn("sidebar-subitem", pathname === "/admin/logo" && currentActive === null && "active")}
                >
                  LOGO 管理
                </Link>
                <Link
                  href="/admin/contact-info"
                  onClick={() => handleNavClick("/admin/contact-info")}
                  className={cn("sidebar-subitem", pathname === "/admin/contact-info" && currentActive === null && "active")}
                >
                  聯絡資訊管理
                </Link>
                <Link
                  href="/admin/ip-blacklist"
                  onClick={() => handleNavClick("/admin/ip-blacklist")}
                  className={cn("sidebar-subitem", pathname === "/admin/ip-blacklist" && currentActive === null && "active")}
                >
                  IP封鎖管理
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* BANNER 管理 */}
        <Link
          href="/admin/banner"
          onClick={() => handleNavClick("/admin/banner")}
          className={cn(
            "sidebar-item i-banner",
            pathname?.startsWith("/admin/banner") && "active"
          )}
        >
          <span className="icon" />
          BANNER 管理
        </Link>
      

        {/* 跑馬燈管理 */}
        <Link
          href="/admin/marquee"
          onClick={() => handleNavClick("/admin/marquee")}
          className={cn(
            "sidebar-item i-marquee",
            pathname?.startsWith("/admin/marquee") && !pathname?.startsWith("/admin/marquee-tags") && "active"
          )}
        >
          <span className="icon" />
          跑馬燈管理
        </Link>

        {/* 標籤管理 */}
        <Link
          href="/admin/marquee-tags"
          onClick={() => handleNavClick("/admin/marquee-tags")}
          className={cn(
            "sidebar-item i-modules",
            pathname?.startsWith("/admin/marquee-tags") && "active"
          )}
        >
          <span className="icon" />
          標籤管理
        </Link>

        {/* 最新消息管理 */}
        {["SUPER_ADMIN", "GLOBAL_ADMIN", "AGENT_OWNER", "AGENT_LEVEL_1"].includes(role) && (
          <Link
            href="/admin/news"
            onClick={() => handleNavClick("/admin/news")}
            className={cn(
              "sidebar-item i-modules",
              pathname?.startsWith("/admin/news") && "active"
            )}
          >
            <span className="icon" />
            最新消息
          </Link>
        )}

        {/* 文章管理 */}
        <div>
            <button
              onClick={() => {
                toggleMenu("articles");
                setCurrentActive("articles");
              }}
              className={cn(
                "sidebar-item i-modules", 
                currentActive === "articles" && "active",
                activeMenu === "articles" && "expanded"
              )}
            >
              <span className="icon" />
              文章管理
              <span className="i-arrow"></span>
            </button>
            <div className={cn("sidebar-submenu", activeMenu === "articles" && "open")}>
              <div className="sidebar-fd">
                <Link
                  href="/admin/article-categories"
                  onClick={() => handleNavClick("/admin/article-categories")}
                  className={cn("sidebar-subitem", pathname === "/admin/article-categories" && currentActive === null && "active")}
                >
                  文章分類
                </Link>
                <Link
                  href="/admin/articles"
                  onClick={() => handleNavClick("/admin/articles")}
                  className={cn("sidebar-subitem", pathname === "/admin/articles" && currentActive === null && "active")}
                >
                  文章列表
                </Link>
              </div>
            </div>
          </div>

        <Link
          href="/admin/id-verification"
          onClick={() => handleNavClick("/admin/id-verification")}
          className={cn("sidebar-item i-verify", pathname?.startsWith("/admin/id-verification") && currentActive === null && "active")}
        >
          <span className="icon" />
          驗證通知
        </Link>


        {/* 商品管理 */}
        {["SUPER_ADMIN", "GLOBAL_ADMIN", "AGENT_OWNER", "AGENT_LEVEL_1", "AGENT_LEVEL_2", "AGENT_LEVEL_3", "AGENT_LEVEL_4", "AGENT_SUPPORT"].includes(role) && (
          <div>
            <button
              onClick={() => {
                toggleMenu("products");
                setCurrentActive("products");
              }}
              className={cn(
                "sidebar-item i-modules", 
                currentActive === "products" && "active",
                activeMenu === "products" && "expanded"
              )}
            >
              <span className="icon" />
              商品管理
              <span className="i-arrow"></span>
            </button>
            <div className={cn("sidebar-submenu", activeMenu === "products" && "open")}>
              <div className="sidebar-fd">
                <Link
                  href="/admin/product-categories"
                  onClick={() => handleNavClick("/admin/product-categories")}
                  className={cn("sidebar-subitem", pathname === "/admin/product-categories" && currentActive === null && "active")}
                >
                  商品分類
                </Link>
                <Link
                  href="/admin/products"
                  onClick={() => handleNavClick("/admin/products")}
                  className={cn("sidebar-subitem", pathname === "/admin/products" && currentActive === null && "active")}
                >
                  商品列表
                </Link>
                <Link
                  href="/admin/products/new"
                  onClick={() => handleNavClick("/admin/products/new")}
                  className={cn("sidebar-subitem", pathname === "/admin/products/new" && currentActive === null && "active")}
                >
                  新增商品
                </Link>
                <Link
                  href="/admin/shipping-rules"
                  onClick={() => handleNavClick("/admin/shipping-rules")}
                  className={cn("sidebar-subitem", pathname === "/admin/shipping-rules" && currentActive === null && "active")}
                >
                  運送規則
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 優惠活動管理 */}
        {["SUPER_ADMIN", "GLOBAL_ADMIN", "AGENT_OWNER", "AGENT_LEVEL_1"].includes(role) && (
          <div>
            <button
              onClick={() => {
                toggleMenu("promotions");
                setCurrentActive("promotions");
              }}
              className={cn(
                "sidebar-item i-modules", 
                currentActive === "promotions" && "active",
                activeMenu === "promotions" && "expanded"
              )}
            >
              <span className="icon" />
              優惠活動
              <span className="i-arrow"></span>
            </button>
            <div className={cn("sidebar-submenu", activeMenu === "promotions" && "open")}>
              <div className="sidebar-fd">
                <Link
                  href="/admin/promotion-categories"
                  onClick={() => handleNavClick("/admin/promotion-categories")}
                  className={cn("sidebar-subitem", pathname === "/admin/promotion-categories" && currentActive === null && "active")}
                >
                  活動分類
                </Link>
                <Link
                  href="/admin/promotions"
                  onClick={() => handleNavClick("/admin/promotions")}
                  className={cn("sidebar-subitem", pathname === "/admin/promotions" && currentActive === null && "active")}
                >
                  活動列表
                </Link>
                <Link
                  href="/admin/promotions/new"
                  onClick={() => handleNavClick("/admin/promotions/new")}
                  className={cn("sidebar-subitem", pathname === "/admin/promotions/new" && currentActive === null && "active")}
                >
                  新增活動
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 優惠碼管理 */}
        {["SUPER_ADMIN", "GLOBAL_ADMIN", "AGENT_OWNER", "AGENT_SUPPORT", "AGENT_LEVEL_1"].includes(role) && (
          <div>
            <button
              onClick={() => {
                toggleMenu("coupons");
                setCurrentActive("coupons");
              }}
              className={cn(
                "sidebar-item i-modules", 
                currentActive === "coupons" && "active",
                activeMenu === "coupons" && "expanded"
              )}
            >
              <span className="icon" />
              優惠碼管理
              <span className="i-arrow"></span>
            </button>
            <div className={cn("sidebar-submenu", activeMenu === "coupons" && "open")}>
              <div className="sidebar-fd">
                <Link
                  href="/admin/coupons"
                  onClick={() => handleNavClick("/admin/coupons")}
                  className={cn("sidebar-subitem", pathname === "/admin/coupons" && currentActive === null && "active")}
                >
                  模板管理
                </Link>
                <Link
                  href="/admin/coupons/distribute"
                  onClick={() => handleNavClick("/admin/coupons/distribute")}
                  className={cn("sidebar-subitem", pathname === "/admin/coupons/distribute" && currentActive === null && "active")}
                >
                  發放優惠碼
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 訂單管理 */}
        <Link
          href="/admin/orders"
          onClick={() => handleNavClick("/admin/orders")}
          className={cn("sidebar-item i-plan", pathname === "/admin/orders" && "active")}
        >
          <span className="icon" />
          訂單管理
        </Link>

        {/* 小活動 */}
        <div>
          <button
            onClick={() => {
              toggleMenu("mini-activities");
              setCurrentActive("mini-activities");
            }}
            className={cn(
              "sidebar-item i-plan", 
              currentActive === "mini-activities" && "active",
              activeMenu === "mini-activities" && "expanded"
            )}
          >
            <span className="icon" />
            小活動
            <span className="i-arrow"></span>
          </button>
          <div className={cn("sidebar-submenu", activeMenu === "mini-activities" && "open")}>
            <div className="sidebar-fd">
              {/* 簽到活動子選單 */}
              <div>
                <button
                  onClick={() => {
                    toggleSubMenu("checkin");
                    setCurrentActive("checkin");
                  }}
                  className={cn(
                    "sidebar-subitem-parent", 
                    currentActive === "checkin" && "active",
                    activeSubMenu === "checkin" && "expanded"
                  )}
                >
                  簽到活動
                  <span className="i-arrow"></span>
                </button>
                <div className={cn("sidebar-sub-submenu", activeSubMenu === "checkin" && "open")}>
                  <Link
                    href="/checkin/strict-streak"
                    onClick={() => handleNavClick("/checkin/strict-streak")}
                    className={cn("sidebar-sub-subitem", pathname === "/checkin/strict-streak" && currentActive === null && "active")}
                  >
                    連續簽到
                  </Link>
                  <Link
                    href="/checkin/flex-cumulative"
                    onClick={() => handleNavClick("/checkin/flex-cumulative")}
                    className={cn("sidebar-sub-subitem", pathname === "/checkin/flex-cumulative" && currentActive === null && "active")}
                  >
                    累積簽到
                  </Link>
                  <Link
                    href="/checkin/daily"
                    onClick={() => handleNavClick("/checkin/daily")}
                    className={cn("sidebar-sub-subitem", pathname === "/checkin/daily" && currentActive === null && "active")}
                  >
                    每日簽到
                  </Link>
                </div>
              </div>
              
              {/* 輪盤管理子選單 */}
              <div>
                <button
                  onClick={() => {
                    toggleSubMenu("lucky-draw");
                    setCurrentActive("lucky-draw");
                  }}
                  className={cn(
                    "sidebar-subitem-parent", 
                    currentActive === "lucky-draw" && "active",
                    activeSubMenu === "lucky-draw" && "expanded"
                  )}
                >
                  輪盤管理
                  <span className="i-arrow"></span>
                </button>
                <div className={cn("sidebar-sub-submenu", activeSubMenu === "lucky-draw" && "open")}>
                  <Link
                    href="/lucky-draw/prizes"
                    onClick={() => handleNavClick("/lucky-draw/prizes")}
                    className={cn("sidebar-sub-subitem", pathname === "/lucky-draw/prizes" && currentActive === null && "active")}
                  >
                    轉盤獎項列表
                  </Link>
                  <Link
                    href="/lucky-draw/events"
                    onClick={() => handleNavClick("/lucky-draw/events")}
                    className={cn("sidebar-sub-subitem", pathname === "/lucky-draw/events" && currentActive === null && "active")}
                  >
                    活動管理
                  </Link>
                  <Link
                    href="/lucky-draw/records"
                    onClick={() => handleNavClick("/lucky-draw/records")}
                    className={cn("sidebar-sub-subitem", pathname === "/lucky-draw/records" && currentActive === null && "active")}
                  >
                    抽獎記錄
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>





        {/* 浮動廣告管理 */}
        <Link
          href="/admin/floating-ad"
          onClick={() => handleNavClick("/admin/floating-ad")}
          className={cn("sidebar-item i-plan", pathname === "/admin/floating-ad" && "active")}
        >
          <span className="icon" />
          浮動廣告管理
        </Link>








        {/* 彈窗公告管理 */}
        <div>
          <button
            onClick={() => {
              toggleMenu("popup-announcement");
              setCurrentActive("popup-announcement");
            }}
            className={cn(
              "sidebar-item i-banner", 
              currentActive === "popup-announcement" && "active",
              activeMenu === "popup-announcement" && "expanded"
            )}
          >
            <span className="icon" />
            彈窗公告
            <span className="i-arrow"></span>
          </button>
          <div className={cn("sidebar-submenu", activeMenu === "popup-announcement" && "open")}>
            <Link
              href="/admin/popup-announcement"
              onClick={() => handleNavClick("/admin/popup-announcement")}
              className={cn("sidebar-subitem", pathname === "/admin/popup-announcement" && currentActive === null && "active")}
            >
              公告列表
            </Link>
            <Link
              href="/admin/popup-announcement/new"
              onClick={() => handleNavClick("/admin/popup-announcement/new")}
              className={cn("sidebar-subitem", pathname === "/admin/popup-announcement/new" && currentActive === null && "active")}
            >
              新增公告
            </Link>
          </div>
        </div>

        {/* 維護管理 */}
        {["SUPER_ADMIN", "GLOBAL_ADMIN", "AGENT_OWNER", "AGENT_LEVEL_1"].includes(role) && (
          <Link
            href="/admin/maintenance"
            onClick={() => handleNavClick("/admin/maintenance")}
            className={cn("sidebar-item i-modules", pathname === "/admin/maintenance" && "active")}
          >
            <span className="icon" />
            維護管理
          </Link>
        )}

        {/* 操作紀錄 */}
        <div>
          <button
            onClick={() => {
              toggleMenu("audit");
              setCurrentActive("audit");
            }}
            className={cn(
              "sidebar-item i-log", 
              currentActive === "audit" && "active",
              activeMenu === "audit" && "expanded"
            )}
          >
            <span className="icon" />
            操作紀錄
            <span className="i-arrow"></span>
          </button>
          <div className={cn("sidebar-submenu", activeMenu === "audit" && "open")}>
            <Link href="/audit-log/admin-user" onClick={() => handleNavClick("/audit-log/admin-user")} className={cn("sidebar-subitem", pathname === "/audit-log/admin-user" && currentActive === null && "active")}>
              管理員操作紀錄
            </Link>
            <Link href="/audit-log/back-userstatus" onClick={() => handleNavClick("/audit-log/back-userstatus")} className={cn("sidebar-subitem", pathname === "/audit-log/back-userstatus" && currentActive === null && "active")}>
              會員狀態紀錄
            </Link>
            <Link href="/audit-log/back-login" onClick={() => handleNavClick("/audit-log/back-login")} className={cn("sidebar-subitem", pathname === "/audit-log/back-login" && currentActive === null && "active")}>
              後台登入紀錄
            </Link>
            <Link href="/audit-log/back-banner" onClick={() => handleNavClick("/audit-log/back-banner")} className={cn("sidebar-subitem", pathname === "/audit-log/back-banner" && currentActive === null && "active")}>
              BANNER紀錄
            </Link>
            <Link href="/audit-log/back-marquee" onClick={() => handleNavClick("/audit-log/back-marquee")} className={cn("sidebar-subitem", pathname === "/audit-log/back-marquee" && currentActive === null && "active")}>
              跑馬燈紀錄
            </Link>
            <Link href="/audit-log/back-blacklist" onClick={() => handleNavClick("/audit-log/back-blacklist")} className={cn("sidebar-subitem", pathname === "/audit-log/back-blacklist" && currentActive === null && "active")}>
              黑名單紀錄
            </Link>
            <Link href="/audit-log/portal-login" onClick={() => handleNavClick("/audit-log/portal-login")} className={cn("sidebar-subitem", pathname === "/audit-log/portal-login" && currentActive === null && "active")}>
              前台登入紀錄
            </Link>
            <Link href="/audit-log/portal-action" onClick={() => handleNavClick("/audit-log/portal-action")} className={cn("sidebar-subitem", pathname === "/audit-log/portal-action" && currentActive === null && "active")}>
              前台操作紀錄
            </Link>
            <Link href="/audit-log/balance-operations" onClick={() => handleNavClick("/audit-log/balance-operations")} className={cn("sidebar-subitem", pathname === "/audit-log/balance-operations" && currentActive === null && "active")}>
              存扣款紀錄
            </Link>
            <Link href="/audit-log/coupon-operations" onClick={() => handleNavClick("/audit-log/coupon-operations")} className={cn("sidebar-subitem", pathname === "/audit-log/coupon-operations" && currentActive === null && "active")}>
              優惠券紀錄
            </Link>
            <Link href="/audit-log/wallet-transactions" onClick={() => handleNavClick("/audit-log/wallet-transactions")} className={cn("sidebar-subitem", pathname === "/audit-log/wallet-transactions" && currentActive === null && "active")}>
              錢包記錄
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
