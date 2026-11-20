"use client";
import { useEffect, useRef } from "react";
import { useMotionPreference } from "@/lib/motion-preference";
/** Decorative city-network sculpture; business links remain semantic HTML. */
export function CitySphere() {
  const ref = useRef<HTMLCanvasElement>(null);
  const preference = useMotionPreference();
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const palette = getComputedStyle(canvas);
    const signal =
      palette.getPropertyValue("--sphere-rgb").trim() || "108, 149, 255";
    const violet =
      palette.getPropertyValue("--sphere-violet-rgb").trim() || "163, 80, 255";
    const light =
      palette.getPropertyValue("--sphere-light").trim() || "#d6caff";
    let meridianStroke: CanvasGradient | string = `rgba(${signal},0.25)`;
    let latitudeStroke: CanvasGradient | string = `rgba(${violet},0.3)`;
    const compact = window.matchMedia(
      "(max-width: 760px), (pointer: coarse)",
    ).matches;
    const pointCount = compact ? 90 : 180;
    const segments = compact ? 48 : 80;
    const meridians = compact ? 8 : 12;
    let size = 0,
      raf = 0,
      last = 0,
      phase = 0;
    let visible = false;
    let pointerX = 0,
      pointerY = 0,
      rotationX = 0,
      rotationY = 0;
    const points = Array.from({ length: pointCount }, (_, i) => {
      const y = 1 - (i / (pointCount - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const angle = i * Math.PI * (3 - Math.sqrt(5));
      return [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
    });
    const project = (x: number, y: number, z: number) => {
      const yaw = phase + rotationX,
        pitch = -0.28 + rotationY;
      const a = x * Math.cos(yaw) + z * Math.sin(yaw);
      const b = -x * Math.sin(yaw) + z * Math.cos(yaw);
      const c = y * Math.cos(pitch) - b * Math.sin(pitch);
      const depth = y * Math.sin(pitch) + b * Math.cos(pitch);
      const perspective = 3.5 / (3.5 - depth);
      return [
        size / 2 + a * size * 0.34 * perspective,
        size / 2 + c * size * 0.34 * perspective,
        depth,
      ];
    };
    const draw = () => {
      context.clearRect(0, 0, size, size);
      const halo = context.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size * 0.48,
      );
      halo.addColorStop(0, `rgba(${signal},0.06)`);
      halo.addColorStop(0.75, `rgba(${signal},0.035)`);
      halo.addColorStop(1, `rgba(${signal},0)`);
      context.fillStyle = halo;
      context.fillRect(0, 0, size, size);
      for (let ring = 0; ring < meridians; ring++) {
        const longitude = (ring * Math.PI * 2) / meridians;
        context.beginPath();
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          const [x, y] = project(
            Math.cos(angle) * Math.cos(longitude),
            Math.sin(angle),
            Math.cos(angle) * Math.sin(longitude),
          );
          if (i === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.strokeStyle = meridianStroke;
        context.lineWidth = 0.65;
        context.stroke();
      }
      for (let ring = -3; ring <= 3; ring++) {
        const latitude = (ring * Math.PI) / 8,
          radius = Math.cos(latitude);
        context.beginPath();
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          const [x, y] = project(
            radius * Math.cos(angle),
            Math.sin(latitude),
            radius * Math.sin(angle),
          );
          if (i === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.strokeStyle = latitudeStroke;
        context.stroke();
      }
      for (const point of points) {
        const [x, y, depth] = project(point[0], point[1], point[2]);
        const pointColor = x > size * 0.6 ? violet : signal;
        context.fillStyle = `rgba(${pointColor},${0.2 + (depth + 1) * 0.3})`;
        context.beginPath();
        context.arc(x, y, depth > 0.6 ? 1.6 : 0.85, 0, Math.PI * 2);
        context.fill();
      }
      // A bright signal travels around the equator, without implying live business data.
      const [x, y] = project(Math.cos(phase * 3), 0, Math.sin(phase * 3));
      context.shadowBlur = 18;
      context.shadowColor = light;
      context.fillStyle = light;
      context.beginPath();
      context.arc(x, y, 3, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
    };
    const tick = (now: number) => {
      if (!visible || document.hidden || preference !== "full") {
        raf = 0;
        return;
      }
      if (now - last >= (compact ? 48 : 32)) {
        phase += Math.min((now - last) / 1000, 0.05) * 0.1;
        rotationX += (pointerX - rotationX) * 0.04;
        rotationY += (pointerY - rotationY) * 0.04;
        last = now;
        draw();
      }
      raf = requestAnimationFrame(tick);
    };
    const resume = () => {
      if (!raf && visible && !document.hidden && preference === "full") {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const resize = new ResizeObserver(() => {
      size = canvas.getBoundingClientRect().width;
      const ratio = Math.min(
        window.devicePixelRatio || 1,
        compact ? 1.25 : 1.5,
      );
      canvas.width = Math.round(size * ratio);
      canvas.height = Math.round(size * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      // Cache the blue/violet wire gradients until the canvas size changes.
      meridianStroke = context.createLinearGradient(0, 0, size, size);
      meridianStroke.addColorStop(0, `rgba(${signal},0.36)`);
      meridianStroke.addColorStop(1, `rgba(${violet},0.28)`);
      latitudeStroke = context.createLinearGradient(0, size, size, 0);
      latitudeStroke.addColorStop(0, `rgba(${signal},0.3)`);
      latitudeStroke.addColorStop(1, `rgba(${violet},0.38)`);
      draw();
      resume();
    });
    resize.observe(canvas);
    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        resume();
      },
      { threshold: 0.05 },
    );
    intersection.observe(canvas);
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || preference !== "full") return;
      const rect = canvas.getBoundingClientRect();
      pointerX =
        ((event.clientX - rect.left - rect.width / 2) / rect.width) * 0.45;
      pointerY =
        ((event.clientY - rect.top - rect.height / 2) / rect.height) * 0.25;
    };
    const leave = () => {
      pointerX = 0;
      pointerY = 0;
    };
    const parent = canvas.parentElement;
    parent?.addEventListener("pointermove", move, { passive: true });
    parent?.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", resume);
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      intersection.disconnect();
      parent?.removeEventListener("pointermove", move);
      parent?.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [preference]);
  return <canvas className="city-sphere" ref={ref} aria-hidden="true" />;
}
