import { notFound } from "next/navigation";
import {
  PageHero,
  ButtonLink,
  SectionHeading,
  EmptyState,
} from "@/components/ui";
import { ApplicationForm } from "@/components/application-form";
import { EventCard } from "@/components/listings";
import { getCities, getEvents } from "@/lib/data";
import { cityStatuses } from "@/lib/catalog";
import { metadata as meta } from "@/lib/seo";
export const revalidate = 60;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const city = (await getCities()).find((c) => c.slug === slug);
  return meta(
    city ? `${city.name}城市共建` : "城市未找到",
    city ? `了解${city.name}城市共建状态、合作方向与活动。` : "城市共建中心",
    `/cities/${slug}`,
  );
}
export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cities = await getCities();
  const city = cities.find((c) => c.slug === slug);
  if (!city) notFound();
  const events = (await getEvents()).filter((e) => e.city_id === city.id);
  return (
    <>
      <PageHero
        eyebrow={`${city.slug.toUpperCase()} / ${cityStatuses[city.status]}`}
        title={`${city.name}，共创从这里开始。`}
        description={
          city.description ||
          `围绕${city.focus}，探索本地企业AI需求与产业协作。当前${cityStatuses[city.status]}，合作进展将在审核后更新。`
        }
      >
        <ButtonLink href="#apply">参与{city.name}共建</ButtonLink>
      </PageHero>
      <section className="section wrap grid-2">
        <div className="info-panel">
          <span className="eyebrow">LOCAL OPPORTUNITIES</span>
          <h2>合作方向</h2>
          <p>{city.focus}</p>
          <p>
            企业需求发现、行业交流、实战专家协作与人才共建。具体合作按资源与需求单独确认。
          </p>
        </div>
        <div className="info-panel">
          <span className="eyebrow">CITY STATUS</span>
          <h2>{cityStatuses[city.status]}</h2>
          <p>
            {city.leader_consent && city.leader_name
              ? `经授权公开的城市负责人：${city.leader_name}`
              : "暂未公布经授权的城市负责人。"}
          </p>
          <p>
            城市主页仅展示已确认的信息。筹备与招募不代表当地已成立正式分会。
          </p>
        </div>
      </section>
      <section className="wrap section-bottom">
        <SectionHeading
          eyebrow="LOCAL GATHERINGS"
          title={`${city.name}的产业活动`}
        />
        {events.length ? (
          <div className="grid-3">
            {events.map((e) => (
              <EventCard key={e.id} event={e} cities={cities} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="本地活动尚待发布"
            description="确认举办信息后，将在本页公布。欢迎提出你的活动共建设想。"
          />
        )}
      </section>
      <section className="section wrap form-wrap">
        <ApplicationForm kind="city" city={city.name} />
      </section>
    </>
  );
}
