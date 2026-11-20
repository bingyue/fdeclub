import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
import { getCities, getEvents } from "@/lib/data";
export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cities, events] = await Promise.all([getCities(), getEvents()]);
  return [
    "",
    "/cities",
    "/enterprise",
    "/events",
    "/membership",
    "/partners",
    "/experts",
    "/about",
    "/book",
    "/privacy",
    "/terms",
    ...cities.map((c) => `/cities/${c.slug}`),
    ...events.map((e) => `/events/${e.slug}`),
  ].map((path) => ({
    url: siteUrl + path,
    changeFrequency: path ? "weekly" : "daily",
    priority: path ? 0.7 : 1,
  }));
}
