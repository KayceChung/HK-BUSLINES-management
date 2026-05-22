"use client";

import { useState } from "react";
import Image from "next/image";
import { Fuel, BarChart2, TrendingDown, ChevronLeft, ChevronRight } from "lucide-react";

export type TabKey = "nhap-nhien-lieu" | "bao-cao-phan-cong" | "bao-cao-tieu-thu";

const NAV_ITEMS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  {
    key: "nhap-nhien-lieu",
    label: "Nhập Nhiên Liệu",
    icon: <Fuel size={20} />,
  },
  {
    key: "bao-cao-phan-cong",
    label: "Báo Cáo Phân Công",
    icon: <BarChart2 size={20} />,
  },
  {
    key: "bao-cao-tieu-thu",
    label: "Báo Cáo Tiêu Thụ",
    icon: <TrendingDown size={20} />,
  },
];

interface SidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`relative flex flex-col bg-slate-900 text-white transition-all duration-300 ease-in-out shrink-0 min-h-screen ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo area */}
      <div className="flex items-center justify-center px-3 py-4 border-b border-slate-700/60 bg-slate-950">
        {collapsed ? (
          /* Icon-only: show just the circular emblem portion */
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shrink-0">
            <span className="text-white font-black text-xs leading-none">HK</span>
          </div>
        ) : (
          <Image
            src="/logo-hk.png"
            alt="HK Buslines Logo"
            width={160}
            height={70}
            className="object-contain"
            priority
          />
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-green-600 text-white shadow-md shadow-green-900/40"
                  : "text-slate-300 hover:bg-slate-700/70 hover:text-white"
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="whitespace-nowrap truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Version tag */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-slate-700/60">
          <p className="text-xs text-slate-500">HK Buslines &copy; 2025</p>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-[72px] z-10 flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 border border-slate-600 text-slate-300 hover:bg-green-600 hover:border-green-600 hover:text-white transition-all duration-150"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
