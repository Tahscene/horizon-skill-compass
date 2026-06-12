import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";

const STORAGE_KEY = "skillhorizon.demo-banner-dismissed";

export function DemoModeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY) !== "1") setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="relative flex items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-200">
      <Sparkles className="h-3.5 w-3.5" aria-hidden />
      <span>Hackathon prototype — sample forecast data shown.</span>
      <button
        type="button"
        aria-label="Dismiss demo banner"
        onClick={() => {
          sessionStorage.setItem(STORAGE_KEY, "1");
          setVisible(false);
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-amber-200/80 hover:bg-amber-500/20 hover:text-amber-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
