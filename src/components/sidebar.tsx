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
    else if (pathname?.startsWith("/admin/loan-product")) setActiveMenu("product");
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

        {/* BANNER 管理 */}
        <div>
          <button
            onClick={() => {
              toggleMenu("banner");
              setCurrentActive("banner");
            }}
            className={cn("sidebar-item i-banner", currentActive === "banner" && "active")}
          >
            <span className="icon" />
            BANNER 管理
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
            className={cn("sidebar-item i-marquee", currentActive === "marquee" && "active")}
          >
            <span className="icon" />
            跑馬燈管理
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
            className={cn("sidebar-item i-plan", currentActive === "product" && "active")}
          >
            <span className="icon" />
            產品管理
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

        {/* 操作紀錄 */}
        <div>
          <button
            onClick={() => {
              toggleMenu("audit");
              setCurrentActive("audit");
            }}
            className={cn("sidebar-item i-log", currentActive === "audit" && "active")}
          >
            <span className="icon" />
            操作紀錄
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
