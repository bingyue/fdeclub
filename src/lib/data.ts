import "server-only";
import { publicDb } from "./supabase";
import { plannedCities, type City, type PublicEvent } from "./catalog";
export async function getCities(): Promise<City[]> {
  const db = publicDb();
  if (!db) return plannedCities;
  const { data, error } = await db
    .from("cities")
    .select(
      "id,slug,name,region,focus,status,description,leader_name,leader_consent",
    )
    .eq("is_public", true)
    .order("created_at");
  if (error) throw new Error("城市资料暂时无法读取，请稍后重试");
  return data || [];
}
export async function getEvents(): Promise<PublicEvent[]> {
  const db = publicDb();
  if (!db) return [];
  const { data, error } = await db.rpc("public_events");
  if (error) throw new Error("活动资料暂时无法读取，请稍后重试");
  return (data || []).sort((a: PublicEvent, b: PublicEvent) =>
    a.starts_at.localeCompare(b.starts_at),
  );
}
export async function getHomeSettings() {
  const fallback = {
    eyebrow: "城市共建伙伴 · 开放招募",
    description:
      "连接企业需求、FDE实战专家、城市伙伴与产业资源，从一次真实的对话，走向可交付的AI实践。",
    show_events: true,
  };
  const db = publicDb();
  if (!db) return fallback;
  const { data, error } = await db
    .from("site_settings")
    .select("value")
    .eq("key", "home")
    .single();
  if (error) return fallback;
  return { ...fallback, ...data?.value };
}
export async function getEventTypes(): Promise<string[]> {
  const db = publicDb();
  const { data } = db
    ? await db
        .from("site_settings")
        .select("value")
        .eq("key", "event_types")
        .single()
    : { data: null };
  return data?.value || ["企业沙龙", "城市Meetup", "共创工作坊", "产业论坛"];
}
