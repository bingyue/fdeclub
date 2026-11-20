"use client";
import { useSyncExternalStore } from "react";
export type MotionPreference = "full" | "paused" | "reduced";
const key = "fdeclub-motion";
const changeEvent = "fdeclub:motion-change";
let fallback: MotionPreference = "full";
function snapshot(): MotionPreference {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return "reduced";
  try {
    const stored = localStorage.getItem(key);
    if (stored === "paused" || stored === "full") return stored;
  } catch {
    /* Storage can be unavailable in privacy mode. */
  }
  return fallback;
}
function subscribe(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  window.addEventListener(changeEvent, callback);
  window.addEventListener("storage", callback);
  return () => {
    media.removeEventListener("change", callback);
    window.removeEventListener(changeEvent, callback);
    window.removeEventListener("storage", callback);
  };
}
export function useMotionPreference() {
  return useSyncExternalStore(subscribe, snapshot, () => "full" as const);
}
export function toggleMotion() {
  fallback = snapshot() === "paused" ? "full" : "paused";
  try {
    localStorage.setItem(key, fallback);
  } catch {
    /* Keep the in-memory preference when persistent storage is unavailable. */
  }
  window.dispatchEvent(new Event(changeEvent));
}
