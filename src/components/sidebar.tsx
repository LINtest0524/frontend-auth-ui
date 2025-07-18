"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";


import { useUserStore } from "@/hooks/use-user-store";

import '@/styles/components/sidebar.css'


export default function Sidebar() {
  const pathname = usePathname();
  const [bannerOpen, setBannerOpen] = useState(false);
  const [marqueeOpen, setMarqueeOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false); // ✅ 操作紀錄展開控制
  const [productOpen, setProductOpen] = useState(false); // ✅ 產品管理展開控制

  const currentUser = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

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



  const role = currentUser?.role ?? "";



  return (
    <div className="sidebar-box">

      <nav>
        <Link
          href="/dashboard"
          className={cn(
            "sidebar-box-li",
            pathname === "/dashboard" && "on"
          )}
        >儀錶板
        </Link>

        <Link
          href="/admin/admin-user"
          className={cn(
            "sidebar-box-li",
            pathname === "/admin/admin-user" && "on"
          )}
        >管理員管理
        </Link>

        <Link
          href="/users"
          className={cn(
            "sidebar-box-li",
            pathname === "/users" && "on"
          )}
        >會員管理
        </Link>

        <Link
          href="/admin/module"
          className={cn(
            "sidebar-box-li",
            pathname?.startsWith("/admin/module") &&
              !pathname.includes("/marquee") &&
              "on"
          )}
        >模組設定
        </Link>

        {/* ✅ Banner 管理 */}
        <div>
        <button
          onClick={() => setBannerOpen(!bannerOpen)}
          className={cn("sidebar-box-li", bannerOpen && "on")}
        >
          BANNER 管理
        </button>

        {bannerOpen && (
          <div className="ml-4">
            <Link
              href="/admin/banner"
              className={cn(
                "sidebar-box-li",
                pathname === "/admin/banner" && "on"
              )}
            >
              Banner 列表
            </Link>
            <Link
              href="/admin/banner/new"
              className={cn(
                "sidebar-box-li",
                pathname === "/admin/banner/new" && "on"
              )}
            >
              新增 Banner
            </Link>
          </div>
        )}
      </div>


        {/* ✅ Marquee 管理 */}
        <div>
          <button
            onClick={() => setMarqueeOpen(!marqueeOpen)}
            className="sidebar-box-li"
          >跑馬燈管理
          </button>
          {marqueeOpen && (
            <div className="ml-4 mt-2 flex flex-col gap-1">
              <Link
                href="/admin/marquee"
                className={cn(
                  "text-sm px-3 py-2 rounded hover:bg-gray-700",
                  pathname === "/admin/marquee" && "bg-gray-700"
                )}
              >跑馬燈列表
              </Link>
              <Link
                href="/admin/marquee/new"
                className={cn(
                  "text-sm px-3 py-2 rounded hover:bg-gray-700",
                  pathname === "/admin/marquee/new" && "bg-gray-700"
                )}
              >新增內容
              </Link>
            </div>
          )}
        </div>



        <Link
          href="/admin/id-verification"
          className={cn(
            "sidebar-box-li",
            pathname?.startsWith("/admin/id-verification") && "on"
          )}
        >驗證通知
        </Link>






        {/* ✅ 產品管理 */}
        <div>
          <button
            onClick={() => setProductOpen(!productOpen)}
            className="sidebar-box-li"
          >產品管理
          </button>
          {productOpen && (
            <div className="">
              <Link
                href="/admin/loan-product"
                className={cn(
                  "",
                  pathname === "/admin/loan-product" && "bg-gray-700"
                )}
              >產品列表
              </Link>

              {["SUPER_ADMIN", "GLOBAL_ADMIN"].includes(role) && (
                <Link
                  href="/admin/loan-product/new"
                  className={cn(
                    "",
                    pathname === "/admin/loan-product/new" && "bg-gray-700"
                  )}
                >新增產品
                </Link>
              )}

            </div>
          )}
        </div>





        {/* ✅ 操作紀錄：展開四種 */}
        <div>
          <button
            onClick={() => setAuditOpen(!auditOpen)}
            className="w-full text-left px-3 py-2 rounded hover:bg-gray-700 bg-gray-800"
          >操作紀錄
          </button>
          {auditOpen && (
            <div className="ml-4 mt-2 flex flex-col gap-1">
              <Link
                href="/audit-log/admin-user"
                className={cn(
                  "text-sm px-3 py-2 rounded hover:bg-gray-700",
                  pathname === "/audit-log/admin-user" && "bg-gray-700"
                )}
              >管理員操作紀錄
              </Link>

              <Link
                href="/audit-log/back-userstatus"
                className={cn(
                  "text-sm px-3 py-2 rounded hover:bg-gray-700",
                  pathname === "/audit-log/back-userstatus" && "bg-gray-700"
                )}
              >會員狀態紀錄
              </Link>

              <Link
                href="/audit-log/back-login"
                className={cn(
                  "text-sm px-3 py-2 rounded hover:bg-gray-700",
                  pathname === "/audit-log/back-login" && "bg-gray-700"
                )}
              >後台登入紀錄
              </Link>
              
              <Link
                href="/audit-log/back-banner"
                className={cn(
                  "text-sm px-3 py-2 rounded hover:bg-gray-700",
                  pathname === "/audit-log/back-banner" && "bg-gray-700"
                )}
              >BANNER紀錄
              </Link>

              <Link
                href="/audit-log/back-marquee"
                className={cn(
                  "text-sm px-3 py-2 rounded hover:bg-gray-700",
                  pathname === "/audit-log/back-marquee" && "bg-gray-700"
                )}
              >跑馬燈紀錄
              </Link>

              
              <Link
                href="/audit-log/back-blacklist"
                className={cn(
                  "text-sm px-3 py-2 rounded hover:bg-gray-700",
                  pathname === "/audit-log/back-blacklist" && "bg-gray-700"
                )}
              >黑名單紀錄
              </Link>

              <Link
                href="/audit-log/portal-login"
                className={cn(
                  "text-sm px-3 py-2 rounded hover:bg-gray-700",
                  pathname === "/audit-log/portal-login" && "bg-gray-700"
                )}
              >前台登入紀錄
              </Link>

              <Link
                href="/audit-log/portal-action"
                className={cn(
                  "text-sm px-3 py-2 rounded hover:bg-gray-700",
                  pathname === "/audit-log/portal-action" && "bg-gray-700"
                )}
              >前台操作紀錄
              </Link>

            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
