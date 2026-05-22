import { NextRequest, NextResponse } from "next/server";

interface FuelPayload {
  date: string;
  licensePlate: string;
  odo: number;
  liters: number;
}

const getScriptUrl = () => process.env.GOOGLE_APPS_SCRIPT_URL;

// ── GET: lịch sử nhiên liệu ───────────────────────────────────
export async function GET() {
  const scriptUrl = getScriptUrl();
  if (!scriptUrl) return NextResponse.json({ error: "GOOGLE_APPS_SCRIPT_URL not set." }, { status: 500 });
  try {
    const res = await fetch(`${scriptUrl}?action=fuel`, { redirect: "follow" });
    const text = await res.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = text; }
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error." }, { status: 500 });
  }
}

// ── POST: ghi nhận nhiên liệu mới ────────────────────────────
export async function POST(req: NextRequest) {
  let body: Partial<FuelPayload>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }

  const { date, licensePlate, odo, liters } = body;
  const missing = (["date", "licensePlate", "odo", "liters"] as const).filter(
    (k) => body[k] === undefined || body[k] === null || body[k] === ""
  );
  if (missing.length > 0) return NextResponse.json({ error: "Missing required fields.", fields: missing }, { status: 400 });
  if (Number(odo) <= 0 || Number(liters) <= 0) return NextResponse.json({ error: "odo and liters must be > 0." }, { status: 400 });

  const scriptUrl = getScriptUrl();
  if (!scriptUrl) return NextResponse.json({ error: "GOOGLE_APPS_SCRIPT_URL not set." }, { status: 500 });

  try {
    const gasRes = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "fuel", date, licensePlate, odo: Number(odo), liters: Number(liters) }),
      redirect: "follow",
    });
    const rawText = await gasRes.text();
    let gasData: unknown;
    try { gasData = JSON.parse(rawText); } catch { gasData = rawText; }
    return NextResponse.json({ success: true, data: gasData }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to reach Apps Script.", detail: err instanceof Error ? err.message : "" }, { status: 500 });
  }
}

// ── DELETE: xóa một dòng theo id ─────────────────────────────
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id parameter." }, { status: 400 });

  const scriptUrl = getScriptUrl();
  if (!scriptUrl) return NextResponse.json({ error: "GOOGLE_APPS_SCRIPT_URL not set." }, { status: 500 });

  try {
    const gasRes = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteFuel", id }),
      redirect: "follow",
    });
    const rawText = await gasRes.text();
    let gasData: unknown;
    try { gasData = JSON.parse(rawText); } catch { gasData = rawText; }
    return NextResponse.json(gasData, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error." }, { status: 500 });
  }
}
