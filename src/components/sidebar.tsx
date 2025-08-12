"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/hooks/use-user-store";
import "@/styles/components/sidebar.css";

export default function Sidebar() {
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [currentActive, setCurrentActive] = useState<string | null>(null);

  const currentUser = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const role = currentUser?.role ?? "";

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
    if (pathname?.startsWith("/admin/banner")) setActiveMenu("banner");
    else if (pathname?.startsWith("/admin/marquee")) setActiveMenu("marquee");
    else if (pathname?.startsWith("/admin/news")) setActiveMenu("news");
    else if (pathname?.startsWith("/admin/articles")) setActiveMenu("articles");
    else if (pathname?.startsWith("/admin/article-categories")) setActiveMenu("articles");
    else if (pathname?.startsWith("/admin/loan-product")) setActiveMenu("product");
    else if (pathname?.startsWith("/admin/floating-ad")) setActiveMenu("floating-ad");
    else if (pathname?.startsWith("/admin/menu")) setActiveMenu("website");
    else if (pathname?.startsWith("/lucky-draw")) setActiveMenu("lucky-draw");
    else if (pathname?.startsWith("/audit-log")) setActiveMenu("audit");
    else setActiveMenu(null);
  }, [pathname]);

  const toggleMenu = (menu: string) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  const resetMenu = () => {
    setCurrentActive(null);
    setActiveMenu(null);
  };

  return (
    <div className="sidebar-box">
      <nav>
        <Link
          href="/dashboard"
          onClick={resetMenu}
          className={cn("sidebar-item i-dashboard", pathname === "/dashboard" && currentActive === null && "active")}
        >
          <span className="icon" />
          儀錶板
        </Link>

        <Link
          href="/admin/admin-user"
          onClick={resetMenu}
          className={cn("sidebar-item i-admin", pathname === "/admin/admin-user" && currentActive === null && "active")}
        >
          <span className="icon" />
          管理員管理
        </Link>

        <Link
          href="/users"
          onClick={resetMenu}
          className={cn("sidebar-item i-user", pathname === "/users" && currentActive === null && "active")}
        >
          <span className="icon" />
          會員管理
        </Link>

        {["SUPER_ADMIN", "GLOBAL_ADMIN"].includes(role) && (
          <Link
            href="/admin/module"
            onClick={resetMenu}
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

        {/* 網站設定 - 只有超級管理員、全域管理員、代理商老闆可以看到 */}
        {["SUPER_ADMIN", "GLOBAL_ADMIN", "AGENT_OWNER"].includes(role) && (
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
                  onClick={resetMenu}
                  className={cn("sidebar-subitem", pathname === "/admin/menu" && currentActive === null && "active")}
                >
                  導航管理
                </Link>
                <Link
                  href="/admin/logo"
                  onClick={resetMenu}
                  className={cn("sidebar-subitem", pathname === "/admin/logo" && currentActive === null && "active")}
                >
                  LOGO 管理
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* BANNER 管理 */}
        <div>
          <button
            onClick={() => {
              toggleMenu("banner");
              setCurrentActive("banner");
            }}
            className={cn(
              "sidebar-item i-banner",
              currentActive === "banner" && "active",
              activeMenu === "banner" && "expanded"
            )}
          >
            <span className="icon" />
            BANNER 管理
            <span className="i-arrow"></span>
          </button>

          <div className={cn("sidebar-submenu", activeMenu === "banner" && "open")}>
            <div className="sidebar-fd">
              <Link
                href="/admin/banner"
                onClick={resetMenu}
                className={cn("sidebar-subitem", pathname === "/admin/banner" && currentActive === null && "active")}
              >
                Banner 列表
              </Link>
              <Link
                href="/admin/banner/new"
                onClick={resetMenu}
                className={cn("sidebar-subitem", pathname === "/admin/banner/new" && currentActive === null && "active")}
              >
                新增 Banner
              </Link>
            </div>
          </div>
        </div>

        {/* 跑馬燈管理 */}
        <div>
          <button
            onClick={() => {
              toggleMenu("marquee");
              setCurrentActive("marquee");
            }}
            className={cn(
              "sidebar-item i-marquee", 
              currentActive === "marquee" && "active",
              activeMenu === "marquee" && "expanded"
            )}
          >
            <span className="icon" />
            跑馬燈管理
            <span className="i-arrow"></span>
          </button>
          <div className={cn("sidebar-submenu", activeMenu === "marquee" && "open")}>
            <Link
              href="/admin/marquee"
              onClick={resetMenu}
              className={cn("sidebar-subitem", pathname === "/admin/marquee" && currentActive === null && "active")}
            >
              跑馬燈列表
            </Link>
            <Link
              href="/admin/marquee/new"
              onClick={resetMenu}
              className={cn("sidebar-subitem", pathname === "/admin/marquee/new" && currentActive === null && "active")}
            >
              新增內容
            </Link>
            <Link
              href="/admin/marquee-tags"
              onClick={resetMenu}
              className={cn("sidebar-subitem", pathname === "/admin/marquee-tags" && currentActive === null && "active")}
            >
              標籤管理
            </Link>
          </div>
        </div>

        {/* 最新消息管理 */}
        {["SUPER_ADMIN", "GLOBAL_ADMIN", "AGENT_OWNER"].includes(role) && (
          <div>
            <button
              onClick={() => {
                toggleMenu("news");
                setCurrentActive("news");
              }}
              className={cn(
                "sidebar-item i-modules", 
                currentActive === "news" && "active",
                activeMenu === "news" && "expanded"
              )}
            >
              <span className="icon" />
              最新消息
              <span className="i-arrow"></span>
            </button>
            <div className={cn("sidebar-submenu", activeMenu === "news" && "open")}>
              <div className="sidebar-fd">
                <Link
                  href="/admin/news"
                  onClick={resetMenu}
                  className={cn("sidebar-subitem", pathname === "/admin/news" && currentActive === null && "active")}
                >
                  消息列表
                </Link>
                <Link
                  href="/admin/news/new"
                  onClick={resetMenu}
                  className={cn("sidebar-subitem", pathname === "/admin/news/new" && currentActive === null && "active")}
                >
                  新增消息
                </Link>
              </div>
            </div>
          </div>
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
                  onClick={resetMenu}
                  className={cn("sidebar-subitem", pathname === "/admin/article-categories" && currentActive === null && "active")}
                >
                  文章分類
                </Link>
                <Link
                  href="/admin/articles"
                  onClick={resetMenu}
                  className={cn("sidebar-subitem", pathname === "/admin/articles" && currentActive === null && "active")}
                >
                  文章列表
                </Link>
                <Link
                  href="/admin/articles/new"
                  onClick={resetMenu}
                  className={cn("sidebar-subitem", pathname === "/admin/articles/new" && currentActive === null && "active")}
                >
                  新增文章
                </Link>
              </div>
            </div>
          </div>

        <Link
          href="/admin/id-verification"
          onClick={resetMenu}
          className={cn("sidebar-item i-verify", pathname?.startsWith("/admin/id-verification") && currentActive === null && "active")}
        >
          <span className="icon" />
          驗證通知
        </Link>

        {/* 產品管理 */}
        <div>
          <button
            onClick={() => {
              toggleMenu("product");
              setCurrentActive("product");
            }}
            className={cn(
              "sidebar-item i-plan", 
              currentActive === "product" && "active",
              activeMenu === "product" && "expanded"
            )}
          >
            <span className="icon" />
            產品管理
            <span className="i-arrow"></span>
          </button>
          <div className={cn("sidebar-submenu", activeMenu === "product" && "open")}>
            <Link
              href="/admin/loan-product"
              onClick={resetMenu}
              className={cn("sidebar-subitem", pathname === "/admin/loan-product" && currentActive === null && "active")}
            >
              產品列表
            </Link>
            {["SUPER_ADMIN", "GLOBAL_ADMIN"].includes(role) && (
              <Link
                href="/admin/loan-product/new"
                onClick={resetMenu}
                className={cn("sidebar-subitem", pathname === "/admin/loan-product/new" && currentActive === null && "active")}
              >
                新增產品
              </Link>
            )}
          </div>
        </div>

        {/* 輪盤管理 */}
        <div>
          <button
            onClick={() => {
              toggleMenu("lucky-draw");
              setCurrentActive("lucky-draw");
            }}
            className={cn(
              "sidebar-item i-plan", 
              currentActive === "lucky-draw" && "active",
              activeMenu === "lucky-draw" && "expanded"
            )}
          >
            <span className="icon" />
            輪盤管理
            <span className="i-arrow"></span>
          </button>
          <div className={cn("sidebar-submenu", activeMenu === "lucky-draw" && "open")}>
            <Link
              href="/lucky-draw/prizes"
              onClick={resetMenu}
              className={cn("sidebar-subitem", pathname === "/lucky-draw/prizes" && currentActive === null && "active")}
            >
              轉盤獎項列表
            </Link>
            <Link
              href="/lucky-draw/events"
              onClick={resetMenu}
              className={cn("sidebar-subitem", pathname === "/lucky-draw/events" && currentActive === null && "active")}
            >
              活動管理
            </Link>
            <Link
              href="/lucky-draw/records"
              onClick={resetMenu}
              className={cn("sidebar-subitem", pathname === "/lucky-draw/records" && currentActive === null && "active")}
            >
              抽獎記錄
            </Link>
          </div>
        </div>

        {/* 浮動廣告管理 */}
        <div>
          <button
            onClick={() => {
              toggleMenu("floating-ad");
              setCurrentActive("floating-ad");
            }}
            className={cn(
              "sidebar-item i-banner", 
              currentActive === "floating-ad" && "active",
              activeMenu === "floating-ad" && "expanded"
            )}
          >
            <span className="icon" />
            浮動廣告
            <span className="i-arrow"></span>
          </button>
          <div className={cn("sidebar-submenu", activeMenu === "floating-ad" && "open")}>
            <Link
              href="/admin/floating-ad"
              onClick={resetMenu}
              className={cn("sidebar-subitem", pathname === "/admin/floating-ad" && currentActive === null && "active")}
            >
              廣告列表
            </Link>
            <Link
              href="/admin/floating-ad/new"
              onClick={resetMenu}
              className={cn("sidebar-subitem", pathname === "/admin/floating-ad/new" && currentActive === null && "active")}
            >
              新增廣告
            </Link>
          </div>
        </div>

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
            <Link href="/audit-log/admin-user" onClick={resetMenu} className={cn("sidebar-subitem", pathname === "/audit-log/admin-user" && currentActive === null && "active")}>
              管理員操作紀錄
            </Link>
            <Link href="/audit-log/back-userstatus" onClick={resetMenu} className={cn("sidebar-subitem", pathname === "/audit-log/back-userstatus" && currentActive === null && "active")}>
              會員狀態紀錄
            </Link>
            <Link href="/audit-log/back-login" onClick={resetMenu} className={cn("sidebar-subitem", pathname === "/audit-log/back-login" && currentActive === null && "active")}>
              後台登入紀錄
            </Link>
            <Link href="/audit-log/back-banner" onClick={resetMenu} className={cn("sidebar-subitem", pathname === "/audit-log/back-banner" && currentActive === null && "active")}>
              BANNER紀錄
            </Link>
            <Link href="/audit-log/back-marquee" onClick={resetMenu} className={cn("sidebar-subitem", pathname === "/audit-log/back-marquee" && currentActive === null && "active")}>
              跑馬燈紀錄
            </Link>
            <Link href="/audit-log/back-blacklist" onClick={resetMenu} className={cn("sidebar-subitem", pathname === "/audit-log/back-blacklist" && currentActive === null && "active")}>
              黑名單紀錄
            </Link>
            <Link href="/audit-log/portal-login" onClick={resetMenu} className={cn("sidebar-subitem", pathname === "/audit-log/portal-login" && currentActive === null && "active")}>
              前台登入紀錄
            </Link>
            <Link href="/audit-log/portal-action" onClick={resetMenu} className={cn("sidebar-subitem", pathname === "/audit-log/portal-action" && currentActive === null && "active")}>
              前台操作紀錄
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
