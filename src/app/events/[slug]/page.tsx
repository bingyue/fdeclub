import Image from "next/image";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui";
import { EventRegistration } from "@/components/event-registration";
import { getEvents, getCities } from "@/lib/data";
import { userDb } from "@/lib/supabase";
import { formatDate, eventState } from "@/lib/catalog";
import { metadata as meta, siteUrl } from "@/lib/seo";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = (await getEvents()).find((e) => e.slug === slug);
  return meta(
    event?.title || "活动未找到",
    event?.summary || "FDE Club产业活动",
    `/events/${slug}`,
  );
}
export default async function EventDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [events, cities, db] = await Promise.all([
    getEvents(),
    getCities(),
    userDb(),
  ]);
  const event = events.find((e) => e.slug === slug);
  if (!event) notFound();
  const user = db ? (await db.auth.getUser()).data.user : null;
  const registration =
    db && user
      ? (
          await db
            .from("event_registrations")
            .select("status")
            .eq("event_id", event.id)
            .eq("user_id", user.id)
            .maybeSingle()
        ).data
      : null;
  const staffInfo =
    db && user
      ? (
          await db
            .from("events")
            .select("checkin_info")
            .eq("id", event.id)
            .maybeSingle()
        ).data
      : null;
  const city = cities.find((c) => c.id === event.city_id);
  const structured = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.summary,
    startDate: event.starts_at,
    endDate: event.ends_at,
    eventStatus:
      event.status === "cancelled"
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.location,
      address: {
        "@type": "PostalAddress",
        addressLocality: city?.name,
        addressCountry: "CN",
      },
    },
    organizer: { "@type": "Organization", name: event.organizer },
    url: `${siteUrl}/events/${event.slug}`,
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structured).replaceAll("<", "\u003c"),
        }}
      />
      <PageHero
        eyebrow={`${event.event_type} / ${eventState(event)}`}
        title={event.title}
        description={event.summary}
      />
      <section className="section wrap event-detail">
        <article>
          {event.poster_url && (
            <Image
              width={1200}
              height={800}
              unoptimized
              className="event-poster"
              src={event.poster_url}
              alt={`${event.title}活动海报`}
              referrerPolicy="no-referrer"
            />
          )}
          <h2>关于这次相聚</h2>
          <div className="event-description">
            {event.description || "请关注主办方发布的活动说明。"}
          </div>
          <h2 style={{ marginTop: 40 }}>参与与报名规则</h2>
          <p className="event-description">
            参与对象：{event.audience}。
            {event.requires_approval
              ? "报名后需审核，通过后方可参加。"
              : "提交成功即可获得名额。"}
            待审核与已确认的报名均占用名额，可在活动开始前取消。当前活动不开放在线收费。
          </p>
          {staffInfo?.checkin_info && (
            <div className="notice">
              <strong>授权运营人员签到信息</strong>
              <p>{staffInfo.checkin_info}</p>
            </div>
          )}
        </article>
        <aside className="event-sidebar">
          <span className="eyebrow">EVENT DETAILS</span>
          <dl>
            <dt>城市</dt>
            <dd>{city?.name || "以活动地点为准"}</dd>
            <dt>开始</dt>
            <dd>{formatDate(event.starts_at)}</dd>
            <dt>结束</dt>
            <dd>{formatDate(event.ends_at)}</dd>
            <dt>地点</dt>
            <dd>{event.location}</dd>
            <dt>主办</dt>
            <dd>{event.organizer}</dd>
            <dt>截止</dt>
            <dd>{formatDate(event.registration_deadline)}</dd>
            <dt>名额</dt>
            <dd>
              容量 {event.capacity} 人 · 当前余位{" "}
              {Math.max(0, event.capacity - event.reserved)} 人
            </dd>
          </dl>
          <p className="subtle">所有时间均为北京时间，名额以提交时核验为准。</p>
          <EventRegistration
            id={event.id}
            loggedIn={!!user}
            initialStatus={registration?.status}
            open={eventState(event) === "开放报名"}
          />
        </aside>
      </section>
    </>
  );
}
