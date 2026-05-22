import { NextRequest, NextResponse } from "next/server";

interface FuelPayload {
  date: string;        // ngày nhập liệu
  licensePlate: string; // BKS
  odo: number;         // Odoo
  liters: number;      // Lượng nhiên liệu ghi nhận
}

export async function POST(req: NextRequest) {
  let body: Partial<FuelPayload>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { date, licensePlate, odo, liters } = body;

  // Validate required fields against actual sheet columns
  const missing = (["date", "licensePlate", "odo", "liters"] as const).filter(
    (k) => body[k] === undefined || body[k] === null || body[k] === ""
  );
  if (missing.length > 0) {
    return NextResponse.json({ error: "Missing required fields.", fields: missing }, { status: 400 });
  }
  if (Number(odo) <= 0 || Number(liters) <= 0) {
    return NextResponse.json({ error: "odo and liters must be greater than 0." }, { status: 400 });
  }

  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!scriptUrl) {
    return NextResponse.json(
      { error: "Server misconfiguration: GOOGLE_APPS_SCRIPT_URL not set." },
      { status: 500 }
    );
  }

  try {
    const gasRes = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "fuel", date, licensePlate, odo: Number(odo), liters: Number(liters) }),
      redirect: "follow",
    });

    const rawText = await gasRes.text();
    console.log("[/api/fuel] GAS status:", gasRes.status, "body:", rawText);

    if (!gasRes.ok) {
      return NextResponse.json({ error: "Apps Script error.", detail: rawText }, { status: 502 });
    }

    let gasData: unknown;
    try { gasData = JSON.parse(rawText); } catch { gasData = rawText; }

    return NextResponse.json({ success: true, data: gasData }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown network error.";
    console.error("[/api/fuel] fetch error:", message);
    return NextResponse.json({ error: "Failed to reach Apps Script.", detail: message }, { status: 500 });
  }
}
