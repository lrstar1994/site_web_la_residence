export const venueSetupIconOptions = [
  { value: "generic", label: "Icône générique" },
  { value: "theatre", label: "Disposition théâtre" },
  { value: "classroom", label: "Disposition classe" },
  { value: "u-shape", label: "Disposition en U" },
  { value: "boardroom", label: "Conseil / Boardroom" },
  { value: "cocktail", label: "Cocktail" },
  { value: "banquet", label: "Banquet" },
  { value: "reception", label: "Réception" },
] as const;

function pathForIcon(iconKey?: string | null) {
  if (iconKey === "theatre") return "M5 7h14M6 11h12M7 15h10M4 19h16";
  if (iconKey === "classroom") return "M4 6h16v8H4zM7 18h10M12 14v4";
  if (iconKey === "u-shape") return "M6 5v9a6 6 0 0012 0V5M9 5v9a3 3 0 006 0V5";
  if (iconKey === "boardroom") return "M4 8h16v8H4zM2 12h2M20 12h2M8 6v2M16 6v2M8 16v2M16 16v2";
  if (iconKey === "cocktail") return "M7 4h10l-5 7-5-7zM12 11v8M9 19h6";
  if (iconKey === "banquet") return "M4 10h16M6 10v9M18 10v9M8 6h8a2 2 0 012 2v2H6V8a2 2 0 012-2z";
  if (iconKey === "reception") return "M12 3l2 5 5 .5-3.8 3.2 1.2 5-4.4-2.7-4.4 2.7 1.2-5L5 8.5 10 8l2-5z";
  return "M4 5h16v14H4zM8 9h8M8 13h8";
}

export function VenueSetupIcon({ iconKey, className }: { iconKey?: string | null; className?: string }) {
  return (
    <span className={className ?? "venue-setup-icon"} aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d={pathForIcon(iconKey)} />
      </svg>
    </span>
  );
}
