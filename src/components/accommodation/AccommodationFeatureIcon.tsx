export const accommodationFeatureIconOptions = [
  { value: "generic", label: "Icône générique" },
  { value: "wifi", label: "Wi-Fi" },
  { value: "parking", label: "Parking" },
  { value: "pool", label: "Piscine" },
  { value: "gym", label: "Salle de sport" },
  { value: "hot-water", label: "Eau chaude" },
  { value: "canal-plus", label: "Télévision / Canal+" },
  { value: "kitchen", label: "Cuisine" },
  { value: "housekeeping", label: "Ménage" },
  { value: "restaurant", label: "Restaurant" },
  { value: "garden", label: "Jardin" },
  { value: "chapel", label: "Chapelle" },
  { value: "king-bed", label: "Lit" },
  { value: "workspace", label: "Espace de travail" },
] as const;

type Props = {
  iconKey?: string | null;
  className?: string;
};

function pathForIcon(iconKey?: string | null) {
  if (!iconKey) return "M12 3l2.4 5 5.6.8-4 3.9.9 5.5L12 15.6 7.1 18.2l.9-5.5-4-3.9 5.6-.8L12 3z";

  if (iconKey.includes("wifi")) return "M4.9 10.8a10 10 0 0114.2 0M7.8 13.7a6 6 0 018.4 0M10.6 16.5a2 2 0 012.8 0M12 19h.01";
  if (iconKey.includes("parking")) return "M8 19V5h5a4 4 0 010 8H8M8 13h5";
  if (iconKey.includes("pool")) return "M4 15c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1M4 19c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1M7 11V5h10v6";
  if (iconKey.includes("gym")) return "M5 8v8M19 8v8M2 10v4M22 10v4M5 12h14";
  if (iconKey.includes("hot-water")) return "M8 18c0-4 8-4 8-9a4 4 0 00-8 0c0 5 8 5 8 9M12 3v4";
  if (iconKey.includes("canal") || iconKey.includes("tv")) return "M4 7h16v10H4zM9 21h6M12 17v4";
  if (iconKey.includes("kitchen")) return "M6 3v18M10 3v7a4 4 0 01-4 4M17 3v18M14 3h6";
  if (iconKey.includes("housekeeping")) return "M6 20h12M9 20l1-8h4l1 8M11 12V5a2 2 0 114 0v7";
  if (iconKey.includes("restaurant")) return "M7 3v8M10 3v8M7 7h3M17 3v18M14 3h6";
  if (iconKey.includes("garden")) return "M12 20V9M12 9c-4 0-6-2-6-6 4 0 6 2 6 6M12 9c4 0 6-2 6-6-4 0-6 2-6 6";
  if (iconKey.includes("chapel")) return "M12 3v5M9.5 5.5h5M5 21V10l7-5 7 5v11M9 21v-6h6v6";
  if (iconKey.includes("bed") || iconKey.includes("lit")) return "M4 19V8M4 14h16M20 19v-5a4 4 0 00-4-4H4M8 10V8h4v2";
  if (iconKey.includes("workspace") || iconKey.includes("desk")) return "M4 9h16v6H4zM8 21l2-6M16 21l-2-6M3 21h18";
  if (iconKey.includes("surface")) return "M4 4h16v16H4zM8 4v16M4 8h16";

  return "M12 3l2.4 5 5.6.8-4 3.9.9 5.5L12 15.6 7.1 18.2l.9-5.5-4-3.9 5.6-.8L12 3z";
}

export function AccommodationFeatureIcon({ iconKey, className }: Props) {
  return (
    <span className={className ?? "accommodation-feature-icon"} aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d={pathForIcon(iconKey)} />
      </svg>
    </span>
  );
}
