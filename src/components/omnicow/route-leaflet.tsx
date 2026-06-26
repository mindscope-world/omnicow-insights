import { useEffect, useRef } from "react";
import type { Farmer, Priority } from "@/lib/omnicow/data";

const PRIORITY_HEX: Record<Priority, string> = {
  urgent: "#C0392B",
  watch: "#B06D0F",
  low: "#1A6E42",
};

export function RouteLeaflet({
  stops,
  onSelect,
}: {
  stops: Farmer[];
  onSelect: (f: Farmer) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current || mapRef.current) return;
      const map = L.map(ref.current, { zoomControl: true }).setView([-1.06, 36.77], 13);
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 18,
      }).addTo(map);

      const latlngs: [number, number][] = [];
      stops.forEach((f, i) => {
        const color = PRIORITY_HEX[f.priority];
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:${color};color:#fff;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:grid;place-items:center;box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid #fff"><span style="transform:rotate(45deg);font-size:12px;font-weight:700">${i + 1}</span></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        });
        const m = L.marker([f.lat, f.lng], { icon }).addTo(map);
        latlngs.push([f.lat, f.lng]);
        m.bindPopup(
          `<div style="font-family:Inter,sans-serif;min-width:160px"><strong>${f.id}</strong><br/><span style="color:#8B6F5E;font-size:12px">${f.ward} ward</span><br/><span style="font-size:12px">Day 7: <b style="color:${color}">${Math.round(f.day7 * 100)}%</b></span><p style="font-size:11px;color:#5C4A3A;margin:6px 0">${f.shap}</p><button id="next-${f.id}" style="background:#1A3C2E;color:#F5F0E8;border:none;padding:5px 10px;border-radius:6px;font-size:12px;cursor:pointer">Set as next stop</button></div>`,
        );
        m.on("popupopen", () => {
          const btn = document.getElementById(`next-${f.id}`);
          btn?.addEventListener("click", () => onSelect(f));
        });
      });
      if (latlngs.length > 1) {
        L.polyline(latlngs, { color: "#1A3C2E", weight: 3, opacity: 0.6, dashArray: "6 8" }).addTo(map);
        map.fitBounds(latlngs, { padding: [40, 40] });
      }
    })();
    return () => {
      cancelled = true;
      // @ts-expect-error leaflet map type
      mapRef.current?.remove?.();
      mapRef.current = null;
    };
  }, [stops, onSelect]);

  return <div ref={ref} className="h-[calc(100vh-9rem)] w-full" />;
}
