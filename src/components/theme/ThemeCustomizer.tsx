import { Palette, Sun, Moon, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { COLOR_PRESETS, useTheme } from "./ThemeProvider";

// Convert "H S% L%" -> hex for <input type="color">
function hslStringToHex(hsl: string): string {
  const [hStr, sStr, lStr] = hsl.split(/\s+/);
  const h = parseFloat(hStr);
  const s = parseFloat(sStr) / 100;
  const l = parseFloat(lStr) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHslString(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hue = 0, sat = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hue = (b - r) / d + 2; break;
      case b: hue = (r - g) / d + 4; break;
    }
    hue *= 60;
  }
  return `${Math.round(hue)} ${Math.round(sat * 100)}% ${Math.round(l * 100)}%`;
}

export const ThemeCustomizer = () => {
  const { mode, preset, primary, secondary, accent, setMode, applyPreset, setColor, reset } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Customize theme" className="rounded-full">
          <Palette className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-5 space-y-5">
        <div>
          <Label className="text-xs font-mono text-muted-foreground">Mode</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={mode === "light" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("light")}
              className="gap-2"
            >
              <Sun className="w-4 h-4" /> Light
            </Button>
            <Button
              type="button"
              variant={mode === "dark" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("dark")}
              className="gap-2"
            >
              <Moon className="w-4 h-4" /> Dark
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-xs font-mono text-muted-foreground">Color presets</Label>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {COLOR_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                title={p.name}
                aria-label={p.name}
                className={`relative aspect-square rounded-lg border-2 transition-all ${
                  preset === p.id ? "border-foreground scale-95" : "border-border hover:border-foreground/40"
                }`}
                style={{
                  background: `linear-gradient(135deg, hsl(${p.primary}), hsl(${p.secondary}))`,
                }}
              >
                {preset === p.id && (
                  <Check className="w-4 h-4 absolute inset-0 m-auto text-white drop-shadow" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-mono text-muted-foreground">Custom colors</Label>
          {[
            { key: "primary" as const, label: "Primary", value: primary },
            { key: "secondary" as const, label: "Secondary", value: secondary },
            { key: "accent" as const, label: "Accent", value: accent },
          ].map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-3">
              <span className="text-sm">{row.label}</span>
              <input
                type="color"
                value={hslStringToHex(row.value)}
                onChange={(e) => setColor(row.key, hexToHslString(e.target.value))}
                className="w-10 h-8 rounded cursor-pointer bg-transparent border border-border"
              />
            </div>
          ))}
        </div>

        <Button variant="ghost" size="sm" onClick={reset} className="w-full gap-2">
          <RotateCcw className="w-3.5 h-3.5" /> Reset to default
        </Button>
      </PopoverContent>
    </Popover>
  );
};
