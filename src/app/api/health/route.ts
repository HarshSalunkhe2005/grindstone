import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/health -> { ok, db } for uptime monitors. Public and cheap: one tiny read of public data.
export async function GET() {
  const started = Date.now();
  let db = false;
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("topics").select("id").limit(1);
    db = !error;
  } catch {
    db = false;
  }
  return NextResponse.json({ ok: db, db, ms: Date.now() - started }, { status: db ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
