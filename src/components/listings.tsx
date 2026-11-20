"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin, CalendarDays, ArrowRight } from "lucide-react";
import {
  cityStatuses,
  eventState,
  formatDate,
  type City,
  type PublicEvent,
} from "@/lib/catalog";
import { EmptyState } from "./ui";
export function CityCard({ city, index = 0 }: { city: City; index?: number }) {
  return (
    <Link href={`/cities/${city.slug}`} className="city-card spotlight">
      <div className="city-card-top">
        <span className="city-index">
          {String(index + 1).padStart(2, "0")} / {city.region}
        </span>
        <span className={`status status-${city.status}`}>
          <i />
          {cityStatuses[city.status]}
        </span>
      </div>
      <div className="city-name">
        <h3>{city.name}</h3>
        <span>{city.slug.toUpperCase()}</span>
      </div>
      <div className="skyline" aria-hidden="true">
        {[30, 46, 24, 59, 77, 41, 64, 33, 51, 27].map((h, i) => (
          <i key={i} style={{ height: `${h}%` }} />
        ))}
      </div>
      <p>{city.focus}</p>
      <div className="city-card-bottom">
        <span>了解城市共建</span>
        <ArrowUpRight size={19} />
      </div>
    </Link>
  );
}
export function CityListing({ cities }: { cities: City[] }) {
  const [region, setRegion] = useState("全部");
  const [status, setStatus] = useState("全部状态");
  const list = cities.filter(
    (c) =>
      (region === "全部" || c.region === region) &&
      (status === "全部状态" || c.status === status),
  );
  return (
    <>
      <div className="filter-bar">
        <div className="filter-tabs" aria-label="按区域筛选">
          {["全部", ...new Set(cities.map((c) => c.region))].map((r) => (
            <button
              key={r}
              aria-pressed={r === region}
              onClick={() => setRegion(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <label className="select-filter">
          <span className="sr-only">城市状态</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>全部状态</option>
            {Object.entries(cityStatuses).map(([k, v]) => (
              <option value={k} key={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="result-count" aria-live="polite">
        {list.length} 个城市方向 · 以公开审核状态为准
      </p>
      <div className="grid-3">
        {list.map((c, i) => (
          <CityCard city={c} key={c.slug} index={i} />
        ))}
      </div>
      {!list.length && (
        <EmptyState
          title="这个区域，期待你的加入"
          description="目前没有符合筛选条件的城市。也欢迎为新的城市提出共建设想。"
          href="#apply"
          label="申请城市共建"
        />
      )}
    </>
  );
}
export function EventCard({
  event,
  cities,
}: {
  event: PublicEvent;
  cities: City[];
}) {
  return (
    <Link href={`/events/${event.slug}`} className="event-card">
      <div className="event-art">
        <span>{event.event_type}</span>
        <div className="event-art-rings" />
        <strong>
          MEET.
          <br />
          CONNECT.
          <br />
          CO-CREATE.
        </strong>
        <ArrowUpRight size={28} />
      </div>
      <div className="event-body">
        <div className="event-top">
          <span className="status">
            <i />
            {eventState(event)}
          </span>
          <span>{cities.find((c) => c.id === event.city_id)?.name}</span>
        </div>
        <h3>{event.title}</h3>
        <p>{event.summary}</p>
        <div className="event-meta">
          <CalendarDays size={15} />
          {formatDate(event.starts_at)}（北京时间）
        </div>
        <div className="event-meta">
          <MapPin size={15} />
          {event.location}
        </div>
        <div className="event-bottom">
          查看活动详情
          <ArrowRight size={16} />
        </div>
      </div>
    </Link>
  );
}
export function EventListing({
  events,
  cities,
  types,
}: {
  events: PublicEvent[];
  cities: City[];
  types: string[];
}) {
  const [type, setType] = useState("全部");
  const [city, setCity] = useState("全部");
  const list = events.filter(
    (e) =>
      (type === "全部" || e.event_type === type) &&
      (city === "全部" || e.city_id === city),
  );
  return (
    <>
      <div className="filter-bar">
        <div className="filter-tabs">
          {["全部", ...types].map((t) => (
            <button
              key={t}
              aria-pressed={t === type}
              onClick={() => setType(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <label className="select-filter">
          <span className="sr-only">活动城市</span>
          <select value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="全部">全部城市</option>
            {cities
              .filter((c) => c.id)
              .map((c) => (
                <option value={c.id} key={c.slug}>
                  {c.name}
                </option>
              ))}
          </select>
        </label>
      </div>
      {list.length ? (
        <div className="grid-3">
          {list.map((e) => (
            <EventCard event={e} cities={cities} key={e.id} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="下一场相遇，正在酝酿"
          description="目前暂无已确认发布的活动。时间、地点和报名名额确认后，将在这里开放报名。"
          href="/partners#apply"
          label="与我们联合策划活动"
        />
      )}
    </>
  );
}
