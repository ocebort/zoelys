import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import type { MapPin } from "@/lib/map.functions";
import type { Dog } from "@/lib/dogs.functions";

export type DogPin = Dog & { lat: number; lng: number };

export const CATEGORY_STYLE: Record<string, { bg: string; glyph: string; label: string }> = {
  event:    { bg: "#c2785a", glyph: "✦",  label: "Event" },
  dog:      { bg: "#8b6f47", glyph: "🐾", label: "Dog" },
  vet:      { bg: "#b8453a", glyph: "✚",  label: "Vet" },
  groomer:  { bg: "#7a9b8e", glyph: "✂",  label: "Groomer" },
  daycare:  { bg: "#d4a574", glyph: "☼",  label: "Daycare" },
  park:     { bg: "#5a7a4a", glyph: "♣",  label: "Park" },
  cafe:     { bg: "#a07855", glyph: "☕", label: "Café" },
  boutique: { bg: "#9b6b8a", glyph: "♥",  label: "Boutique" },
  training: { bg: "#4a6b8a", glyph: "★",  label: "Training" },
  other:    { bg: "#2d2520", glyph: "●",  label: "Partner" },
};

function styleFor(type: MapPin["type"] | "dog", category?: string) {
  if (type === "event") return CATEGORY_STYLE.event;
  if (type === "dog") return CATEGORY_STYLE.dog;
  return CATEGORY_STYLE[category ?? "other"] ?? CATEGORY_STYLE.other;
}

function makePinIcon(type: MapPin["type"] | "dog", category?: string) {
  const cfg = styleFor(type, category);
  return L.divIcon({
    className: "zoelys-pin",
    html: `<div style="
      width:34px;height:34px;border-radius:50%;
      background:${cfg.bg};border:2px solid #faf6f0;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 12px rgba(45,37,32,.35);
      color:#faf6f0;font-size:16px;font-weight:600;">${cfg.glyph}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

export function MapView({
  center,
  pins,
  dogs = [],
  onInviteDog,
}: {
  center: [number, number];
  pins: MapPin[];
  dogs?: DogPin[];
  onInviteDog?: (d: DogPin) => void;
}) {
  const bounds = useMemo(() => {
    const all = [
      ...pins.map((p) => [p.lat, p.lng] as [number, number]),
      ...dogs.map((d) => [d.lat, d.lng] as [number, number]),
    ];
    if (!all.length) return null;
    return L.latLngBounds(all);
  }, [pins, dogs]);

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom
      style={{ height: "70vh", width: "100%" }}
    >
      <FitBounds bounds={bounds} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pins.map((p) => (
        <Marker
          key={`${p.type}-${p.id}`}
          position={[p.lat, p.lng]}
          icon={makePinIcon(p.type, p.category)}
        >
          <Popup>
            <div style={{ minWidth: 220, fontFamily: "Karla, sans-serif" }}>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#c2785a",
                  marginBottom: 4,
                }}
              >
                {p.type === "event" ? "Event" : p.category}
              </div>
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 20,
                  color: "#2d2520",
                  marginBottom: 6,
                  lineHeight: 1.15,
                }}
              >
                {p.name}
              </div>
              <div style={{ fontSize: 12, color: "#6b5d52", marginBottom: 8 }}>
                {p.meta}
              </div>
              <div style={{ fontSize: 12, color: "#8a7a6e", marginBottom: 10 }}>
                {p.address}
              </div>
              {p.url ? (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-block",
                    background: "#c2785a",
                    color: "#faf6f0",
                    padding: "7px 14px",
                    borderRadius: 999,
                    fontWeight: 500,
                    fontSize: 12,
                    textDecoration: "none",
                  }}
                >
                  {p.type === "event" ? "RSVP" : "Visit website"} →
                </a>
              ) : (
                <div style={{ fontSize: 11, color: "#8a7a6e", fontStyle: "italic" }}>
                  No website on file
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {dogs.map((d) => (
        <Marker
          key={`dog-${d.id}`}
          position={[d.lat, d.lng]}
          icon={makePinIcon("dog")}
        >
          <Popup>
            <div style={{ minWidth: 220, fontFamily: "Karla, sans-serif" }}>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#8b6f47",
                  marginBottom: 4,
                }}
              >
                Dog · {d.neighborhood ?? "Miami"}
              </div>
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 22,
                  color: "#2d2520",
                  lineHeight: 1.1,
                }}
              >
                {d.name}
              </div>
              <div style={{ fontSize: 12, color: "#6b5d52", marginTop: 4 }}>
                {[d.breed, d.size, d.age_years ? `${d.age_years}y` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              {d.bio && (
                <p
                  style={{
                    fontSize: 12,
                    color: "#6b5d52",
                    marginTop: 8,
                    fontStyle: "italic",
                  }}
                >
                  "{d.bio}"
                </p>
              )}
              <div style={{ fontSize: 11, color: "#8a7a6e", marginTop: 8 }}>
                with {d.owner_display_name}
              </div>
              {onInviteDog && (
                <button
                  onClick={() => onInviteDog(d)}
                  style={{
                    marginTop: 10,
                    background: "#2d2520",
                    color: "#faf6f0",
                    padding: "8px 16px",
                    borderRadius: 999,
                    fontSize: 11,
                    border: "none",
                    cursor: "pointer",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  Invite to play →
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

function FitBounds({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [bounds, map]);
  return null;
}
