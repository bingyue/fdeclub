import { PageHero, SectionHeading, ButtonLink } from "@/components/ui";
import { CityListing } from "@/components/listings";
import { ApplicationForm } from "@/components/application-form";
import { getCities } from "@/lib/data";
import { metadata as meta } from "@/lib/seo";
export const metadata = meta(
  "城市共建中心",
  "探索城市共建方向，连接本地企业与产业资源，申请成为FDE Club城市共建伙伴。",
  "/cities",
);
export const revalidate = 60;
export default async function Cities() {
  const cities = await getCities();
  return (
    <>
      <PageHero
        eyebrow="CITY CO-CREATION"
        title="把共创的可能，带到你的城市。"
        description="每座城市都有自己的产业土壤。我们寻找愿意扎根本地、连接真实需求的共建伙伴，从一场交流和一个场景开始。"
      >
        <ButtonLink href="#apply">申请城市共建</ButtonLink>
      </PageHero>
      <section className="section wrap">
        <SectionHeading eyebrow="OUR CITY NETWORK" title="寻找你的城市" />
        <CityListing cities={cities} />
      </section>
      <section className="section-soft">
        <div className="wrap grid-2">
          <div className="info-panel">
            <span className="eyebrow">WHO WE LOOK FOR</span>
            <h2>我们期待这样的你</h2>
            <ul className="check-list">
              <li>认可真实业务驱动的企业AI转型</li>
              <li>拥有本地企业、行业或活动组织资源</li>
              <li>愿意持续参与，并遵守品牌与合作边界</li>
              <li>有明确的试点计划与稳定的协作时间</li>
            </ul>
          </div>
          <div className="info-panel">
            <span className="eyebrow">HOW WE BUILD</span>
            <h2>共建之前，先建立共识</h2>
            <ol className="number-list">
              <li>提交本地资源与共建设想</li>
              <li>资料审核与双向访谈</li>
              <li>约定合作范围、责任与品牌使用规则</li>
              <li>审核通过后，授予相应城市协作权限</li>
            </ol>
            <p className="subtle">
              申请不等于成立分会；未经授权，不得代表FDE Club签约或对外作出承诺。
            </p>
          </div>
        </div>
      </section>
      <section className="section wrap form-wrap">
        <ApplicationForm kind="city" />
      </section>
    </>
  );
}
