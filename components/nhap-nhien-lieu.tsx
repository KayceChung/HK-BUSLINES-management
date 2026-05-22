"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

type FormState = "idle" | "submitting" | "success" | "error";

interface FuelLogData {
  ngayNhap: string;   // ngày nhập liệu
  bienSoXe: string;   // BKS
  odo: string;        // Odoo
  soLit: string;      // Lượng nhiên liệu ghi nhận
}

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

const VEHICLES = [
  "51B-123.45",
  "51B-678.90",
  "51H-111.22",
  "51H-333.44",
  "51K-555.66",
];

export default function NhapNhienLieu() {
  const [form, setForm] = useState<FuelLogData>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<FormState>("idle");

  function set(field: keyof FuelLogData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
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
    } catch {
      setStatus("error");
    }
  }

  const isSubmitting = status === "submitting";

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center p-6 pt-10">
      <div className="w-full max-w-xl">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-800">Nhập Nhiên Liệu</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Dữ liệu lưu vào sheet{" "}
            <span className="font-medium text-slate-500">Nhật ký nhiên liệu</span>
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
            {/* Ngày nhập */}
            <Field label="Ngày nhập liệu" required error={errors.ngayNhap}>
              <input
                type="date"
                value={form.ngayNhap}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => set("ngayNhap", e.target.value)}
                disabled={isSubmitting}
                className={input(!!errors.ngayNhap)}
              />
            </Field>

            {/* Biển số xe */}
            <Field label="Biển kiểm soát (BKS)" required error={errors.bienSoXe}>
              <select
                value={form.bienSoXe}
                onChange={(e) => set("bienSoXe", e.target.value)}
                disabled={isSubmitting}
                className={input(!!errors.bienSoXe)}
              >
                <option value="">— Chọn xe —</option>
                {VEHICLES.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>

            {/* Odo */}
            <Field label="Số công tơ mét — Odoo (km)" required error={errors.odo}>
              <input
                type="number"
                min={0}
                placeholder="VD: 125000"
                value={form.odo}
                onChange={(e) => set("odo", e.target.value)}
                disabled={isSubmitting}
                className={input(!!errors.odo)}
              />
            </Field>

            {/* Số lít */}
            <Field label="Lượng nhiên liệu ghi nhận (lít)" required error={errors.soLit}>
              <input
                type="number"
                min={0}
                step="0.1"
                placeholder="VD: 45.5"
                value={form.soLit}
                onChange={(e) => set("soLit", e.target.value)}
                disabled={isSubmitting}
                className={input(!!errors.soLit)}
              />
            </Field>
          </div>

          {/* Alerts */}
          {status === "success" && (
            <Alert
              type="success"
              icon={<CheckCircle2 size={16} />}
              message="Đã ghi vào sheet thành công!"
              onDismiss={() => setStatus("idle")}
            />
          )}
          {status === "error" && (
            <Alert
              type="error"
              icon={<XCircle size={16} />}
              message="Có lỗi xảy ra. Vui lòng thử lại."
              onDismiss={() => setStatus("idle")}
            />
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shadow-sm"
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              {isSubmitting ? "Đang lưu…" : "Lưu phiếu nhập"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Field({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

function Alert({
  type, icon, message, onDismiss,
}: {
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
