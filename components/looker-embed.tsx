"use client";

import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";

interface LookerEmbedProps {
  title: string;
  src: string;
}

export default function LookerEmbed({ title, src }: LookerEmbedProps) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-1 h-5 rounded-full bg-green-600 inline-block" />
          <h1 className="text-base font-semibold text-slate-800">{title}</h1>
        </div>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-green-600 transition-colors"
        >
          <ExternalLink size={13} />
          Mở rộng
        </a>
      </div>

      {/* iFrame area */}
      <div className="relative flex-1 bg-slate-50" style={{ minHeight: "calc(100vh - 65px)" }}>
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white z-10">
            <Loader2 size={32} className="animate-spin text-green-600" />
            <p className="text-sm text-slate-400">Đang tải báo cáo…</p>
          </div>
        )}
        <iframe
          src={src}
          title={title}
          className="w-full h-full border-0"
          style={{ minHeight: "calc(100vh - 65px)" }}
          allowFullScreen
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
}
