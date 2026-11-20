import { publicDb } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const db = publicDb();
    if (!db) throw new Error("UNCONFIGURED");
    const { error } = await db.from("cities").select("id").limit(1);
    if (error) throw error;
    return Response.json(
      { status: "ok" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { status: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
