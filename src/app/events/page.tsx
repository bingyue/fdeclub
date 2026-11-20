import { PageHero, ButtonLink, SectionHeading } from "@/components/ui";
import { EventListing } from "@/components/listings";
import { getCities, getEvents, getEventTypes } from "@/lib/data";
import { metadata as meta } from "@/lib/seo";
export const metadata = meta(
  "产业活动中心",
  "探索FDE Club企业沙龙、城市Meetup与场景共创工作坊，查看已确认的活动与报名信息。",
  "/events",
);
export const revalidate = 60;
export default async function Events() {
  const [cities, events, types] = await Promise.all([
    getCities(),
    getEvents(),
    getEventTypes(),
  ]);
  return (
    <>
      <PageHero
        eyebrow="MEET IN THE REAL WORLD"
        title="好的合作，从面对面开始。"
        description="在真实的对话里发现问题，在不同的经验之间找到启发。参与企业沙龙、城市Meetup与场景共创工作坊。"
      >
        <ButtonLink href="/partners#apply">联合举办活动</ButtonLink>
      </PageHero>
      <section className="section wrap">
        <SectionHeading
          eyebrow="UPCOMING & PAST EVENTS"
          title="寻找下一次相遇"
        />
        <EventListing events={events} cities={cities} types={types} />
      </section>
    </>
  );
}
