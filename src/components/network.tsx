import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CitySphere } from "./city-sphere";
import { cityStatuses, type City } from "@/lib/catalog";
export function Network({ cities }: { cities: City[] }) {
  const positions = [
    [45, 10],
    [85, 31],
    [84, 72],
    [48, 91],
    [10, 70],
    [11, 28],
  ];
  return (
    <div className="network network-sculpture" aria-label="城市共建招募网络">
      <div className="network-grid" aria-hidden="true" />
      <div className="orbit orbit-one" aria-hidden="true" />
      <div className="orbit orbit-two" aria-hidden="true" />
      <CitySphere />
      <div className="sphere-axis" aria-hidden="true" />
      <div className="network-core" aria-hidden="true">
        <span>
          FDE<span className="core-dot">↗</span>
        </span>
        <strong>CLUB</strong>
        <small>连接，正在发生</small>
      </div>
      {cities.slice(0, 6).map((city, i) => (
        <Link
          className="network-node"
          href={`/cities/${city.slug}`}
          key={city.slug}
          style={{
            left: `${positions[i][0]}%`,
            top: `${positions[i][1]}%`,
            animationDelay: `${i * -0.8}s`,
          }}
        >
          <span>
            <i />
            {city.name}
            <ArrowUpRight size={11} />
          </span>
          <small>{cityStatuses[city.status] || "筹备中"}</small>
        </Link>
      ))}
      <span className="network-caption">
        LOCAL CONNECTIONS. SHARED POSSIBILITIES.
      </span>
      <span className="network-coordinate">
        CITY CO-CREATION
        <br />
        NETWORK / 共创网络
      </span>
    </div>
  );
}
