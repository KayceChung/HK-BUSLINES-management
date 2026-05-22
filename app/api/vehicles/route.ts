import { NextResponse } from "next/server";

export async function GET() {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!scriptUrl) {
    return NextResponse.json({ error: "GOOGLE_APPS_SCRIPT_URL not set." }, { status: 500 });
  }
  try {
    const res = await fetch(`${scriptUrl}?action=vehicles`, { redirect: "follow" });
    const text = await res.text();
    console.log("[/api/vehicles] raw GAS response:", text.slice(0, 300));

    let data: Record<string, unknown>;
    try { data = JSON.parse(text); } catch { data = { error: "Non-JSON response", raw: text.slice(0, 200) }; }

    // Nếu Apps Script không nhận được action=vehicles, nó trả checkStatus()
    // → response sẽ có "service" thay vì "vehicles" → báo lỗi rõ ràng
    if (!Array.isArray(data.vehicles)) {
      console.error("[/api/vehicles] unexpected response (no vehicles array):", data);
      return NextResponse.json(
        { error: "Apps Script chưa nhận action=vehicles. Kiểm tra deployment.", raw: data },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, vehicles: data.vehicles }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error.";
    console.error("[/api/vehicles] fetch error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
