const FLAGS: Record<string, string> = {
  Canada: "🇨🇦",
  Germany: "🇩🇪",
  Australia: "🇦🇺",
  UAE: "🇦🇪",
};

export function CountryBadge({ country }: { country: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-xs font-semibold">
      <span aria-hidden>{FLAGS[country] ?? "🌐"}</span>
      {country}
    </span>
  );
}
