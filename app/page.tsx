"use client";

import { useState } from "react";
import Sidebar, { TabKey } from "@/components/sidebar";
import LookerEmbed from "@/components/looker-embed";
import NhapNhienLieu from "@/components/nhap-nhien-lieu";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("nhap-nhien-lieu");

  return (
    <div className="flex min-h-screen">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 overflow-auto">
        {activeTab === "nhap-nhien-lieu" && <NhapNhienLieu />}

        {activeTab === "bao-cao-phan-cong" && (
          <LookerEmbed
            title="Báo Cáo Phân Công"
            src="https://datastudio.google.com/embed/reporting/c696d785-3ea0-4648-a15a-38cc7be93d02/page/p_5eesze4p3d"
          />
        )}

        {activeTab === "bao-cao-tieu-thu" && (
          <LookerEmbed
            title="Báo Cáo Tiêu Thụ"
            src="https://lookerstudio.google.com/embed/reporting/REPLACE_WITH_TIEU_THU_REPORT_ID/page/1"
          />
        )}
      </main>
    </div>
  );
}
