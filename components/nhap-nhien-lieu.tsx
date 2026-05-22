"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2, CheckCircle2, XCircle, RefreshCw, AlertCircle,
  Trash2, ChevronLeft, ChevronRight,
} from "lucide-react";

type FormState = "idle" | "submitting" | "success" | "error";

interface FuelLogData {
  ngayNhap: string;
  bienSoXe: string;
  odo: string;
  soLit: string;
}

interface FuelRow {
  id: number;
  date: string;
  licensePlate: string;
  odo: number;
  liters: number;
}

interface Vehicle {
  id: string | number;
  licensePlate: string;
  type: string;
}

const ROWS_PER_PAGE = 50;

const EMPTY: FuelLogData = {
  ngayNhap: new Date().toISOString().split("T")[0],
  bienSoXe: "",
  odo: "",
  soLit: "",
};

type Errors = Partial<Record<keyof FuelLogData, string>>;

function validate(data: FuelLogData): Errors {
  const e: Errors = {};
  if (!data.ngayNhap) e.ngayNhap = "Vui lòng chọn ngày nhập.";
  if (!data.bienSoXe.trim()) e.bienSoXe = "Vui lòng nhập biển số xe.";
  if (!data.odo || Number(data.odo) <= 0) e.odo = "Số công tơ mét phải > 0.";
  if (!data.soLit || Number(data.soLit) <= 0) e.soLit = "Số lít phải > 0.";
  return e;
}

export default function NhapNhienLieu() {
  const [form, setForm] = useState<FuelLogData>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<FormState>("idle");

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [vehiclesError, setVehiclesError] = useState(false);

  const [history, setHistory] = useState<FuelRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ── Fetch vehicles ────────────────────────────────────────
  useEffect(() => {
    async function fetchVehicles() {
      setVehiclesLoading(true);
      setVehiclesError(false);
      try {
        const res = await fetch("/api/vehicles");
        const data = await res.json();
        if (!res.ok || !Array.isArray(data.vehicles)) throw new Error(data.error ?? "no vehicles");
        setVehicles(data.vehicles);
      } catch {
        setVehiclesError(true);
      } finally {
        setVehiclesLoading(false);
      }
    }
    fetchVehicles();
  }, []);

  // ── Fetch history ─────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(false);
    try {
      const res = await fetch("/api/fuel");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const rows: FuelRow[] = (data.rows ?? []).map((r: FuelRow) => ({
        id: r.id, date: r.date, licensePlate: r.licensePlate, odo: r.odo, liters: r.liters,
      }));
      setHistory(rows.reverse());
      setCurrentPage(1);
    } catch {
      setHistoryError(true);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // ── Form handlers ─────────────────────────────────────────
  function set(field: keyof FuelLogData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStatus("submitting");
    try {
      const res = await fetch("/api/fuel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.ngayNhap,
          licensePlate: form.bienSoXe,
          odo: Number(form.odo),
          liters: Number(form.soLit),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus("success");
      setForm(EMPTY);
      setErrors({});
      fetchHistory();
    } catch {
      setStatus("error");
    }
  }

  // ── Delete handler ────────────────────────────────────────
  async function handleDelete(row: FuelRow) {
    if (!confirm(`Xóa bản ghi #${row.id} — ${row.licensePlate} (${row.date})?`)) return;
    setDeletingId(row.id);
    try {
      const res = await fetch(`/api/fuel?id=${row.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setHistory((prev) => prev.filter((r) => r.id !== row.id));
    } catch {
      alert("Xóa thất bại. Vui lòng thử lại.");
    } finally {
      setDeletingId(null);
    }
  }

  // ── Pagination ────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(history.length / ROWS_PER_PAGE));
  const paginated = history.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const isSubmitting = status === "submitting";

  return (
    <div className="min-h-screen bg-slate-50 p-6 pt-10 space-y-8">
      {/* ── Form ── */}
      <div className="w-full max-w-xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-800">Nhập Nhiên Liệu</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Dữ liệu lưu vào sheet{" "}
            <span className="font-medium text-slate-500">Nhật ký nhiên liệu</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
            <Field label="Ngày nhập liệu" required error={errors.ngayNhap}>
              <input type="date" value={form.ngayNhap}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => set("ngayNhap", e.target.value)}
                disabled={isSubmitting} className={input(!!errors.ngayNhap)} />
            </Field>

            <Field label="Biển kiểm soát (BKS)" required error={errors.bienSoXe}>
              {vehiclesError ? (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-500">
                  <AlertCircle size={13} /> Không tải được danh sách xe
                </div>
              ) : (
                <select value={form.bienSoXe} onChange={(e) => set("bienSoXe", e.target.value)}
                  disabled={isSubmitting || vehiclesLoading} className={input(!!errors.bienSoXe)}>
                  <option value="">{vehiclesLoading ? "Đang tải danh sách xe…" : "— Chọn xe —"}</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.licensePlate}>
                      {v.licensePlate}{v.type ? ` — ${v.type}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="Số công tơ mét — Odoo (km)" required error={errors.odo}>
              <input type="number" min={0} placeholder="VD: 125000" value={form.odo}
                onChange={(e) => set("odo", e.target.value)}
                disabled={isSubmitting} className={input(!!errors.odo)} />
            </Field>

            <Field label="Lượng nhiên liệu ghi nhận (lít)" required error={errors.soLit}>
              <input type="number" min={0} step="0.1" placeholder="VD: 45.5" value={form.soLit}
                onChange={(e) => set("soLit", e.target.value)}
                disabled={isSubmitting} className={input(!!errors.soLit)} />
            </Field>
          </div>

          {status === "success" && (
            <Alert type="success" icon={<CheckCircle2 size={16} />}
              message="Đã ghi vào sheet thành công!" onDismiss={() => setStatus("idle")} />
          )}
          {status === "error" && (
            <Alert type="error" icon={<XCircle size={16} />}
              message="Có lỗi xảy ra. Vui lòng thử lại." onDismiss={() => setStatus("idle")} />
          )}

          <div className="flex justify-end pt-1">
            <button type="submit" disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shadow-sm">
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              {isSubmitting ? "Đang lưu…" : "Lưu phiếu nhập"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Bảng lịch sử ── */}
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Lịch sử ghi nhận</h2>
            {!historyLoading && !historyError && (
              <p className="text-xs text-slate-400 mt-0.5">{history.length} bản ghi</p>
            )}
          </div>
          <button onClick={fetchHistory} disabled={historyLoading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-green-600 disabled:opacity-50 transition-colors">
            <RefreshCw size={13} className={historyLoading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {historyLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
              <Loader2 size={20} className="animate-spin text-green-600" />
              <span className="text-sm">Đang tải dữ liệu…</span>
            </div>
          ) : historyError ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
              <XCircle size={24} className="text-red-400" />
              <span className="text-sm">Không thể tải dữ liệu.</span>
              <button onClick={fetchHistory} className="text-xs text-green-600 hover:underline">Thử lại</button>
            </div>
          ) : history.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-slate-400">
              Chưa có bản ghi nào.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <Th>ID</Th>
                      <Th>Ngày nhập</Th>
                      <Th>Biển số xe</Th>
                      <Th align="right">Odoo (km)</Th>
                      <Th align="right">Lượng NL (lít)</Th>
                      <Th align="center">Xóa</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((row, i) => (
                      <tr key={row.id}
                        className={`border-b border-slate-100 transition-colors hover:bg-green-50/40 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
                        <td className="px-4 py-3 text-slate-400 font-mono text-xs">{row.id}</td>
                        <td className="px-4 py-3 text-slate-700">{row.date}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs font-medium">
                            {row.licensePlate}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700 tabular-nums">
                          {Number(row.odo).toLocaleString("vi-VN")}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-green-700 tabular-nums">
                          {Number(row.liters).toLocaleString("vi-VN", { minimumFractionDigits: 1 })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDelete(row)}
                            disabled={deletingId === row.id}
                            title="Xóa bản ghi"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
                          >
                            {deletingId === row.id
                              ? <Loader2 size={14} className="animate-spin" />
                              : <Trash2 size={14} />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                  <p className="text-xs text-slate-400">
                    Trang <span className="font-semibold text-slate-600">{currentPage}</span> / {totalPages}
                    <span className="ml-2">({history.length} bản ghi)</span>
                  </p>
                  <div className="flex items-center gap-1">
                    <PageBtn onClick={() => setCurrentPage(1)} disabled={currentPage === 1} label="«" />
                    <PageBtn onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1} label="‹" />
                    {/* Số trang xung quanh */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === "..." ? (
                          <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-xs">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setCurrentPage(p as number)}
                            className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                              currentPage === p
                                ? "bg-green-600 text-white"
                                : "text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}
                    <PageBtn onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === totalPages} label="›" />
                    <PageBtn onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} label="»" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function PageBtn({ onClick, disabled, label }: { onClick: () => void; disabled: boolean; label: string }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-7 h-7 rounded text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
      {label}
    </button>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" | "center" }) {
  return (
    <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-${align}`}>
      {children}
    </th>
  );
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

function Alert({ type, icon, message, onDismiss }: {
  type: "success" | "error"; icon: React.ReactNode; message: string; onDismiss: () => void;
}) {
  const cls = type === "success"
    ? "bg-green-50 border-green-200 text-green-700"
    : "bg-red-50 border-red-200 text-red-700";
  return (
    <div className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${cls}`}>
      <span className="flex items-center gap-2">{icon}{message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  );
}

function input(hasError: boolean) {
  return [
    "w-full rounded-lg border px-3 py-2 text-sm text-slate-800 bg-white",
    "focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500",
    "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
    "transition-colors placeholder:text-slate-300",
    hasError ? "border-red-400 bg-red-50" : "border-slate-300",
  ].join(" ");
}
