import { Moon, Sun, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";

export function ThemeSwitcher() {
  const { theme, mode, toggleTheme, toggleMode } = useTheme();
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        aria-label="Toggle color theme"
        title={`Theme: ${theme}`}
      >
        {theme === "crimson" ? <Flame className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMode}
        aria-label="Toggle dark mode"
        title={`Mode: ${mode}`}
      >
        {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </div>
  );
}
