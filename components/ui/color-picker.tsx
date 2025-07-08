"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  presets?: Array<{
    name: string;
    value: string;
    gradient?: string;
  }>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  showInput?: boolean;
  showPresets?: boolean;
}

const DEFAULT_PRESETS = [
  { name: "Ocean Blue", value: "#3B82F6", gradient: "linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)" },
  { name: "Sunset Red", value: "#EF4444", gradient: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)" },
  { name: "Forest Green", value: "#10B981", gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)" },
  { name: "Golden Amber", value: "#F59E0B", gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" },
  { name: "Royal Purple", value: "#8B5CF6", gradient: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)" },
  { name: "Rose Pink", value: "#EC4899", gradient: "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)" },
  { name: "Emerald", value: "#059669", gradient: "linear-gradient(135deg, #059669 0%, #047857 100%)" },
  { name: "Indigo", value: "#6366F1", gradient: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)" },
  { name: "Teal", value: "#14B8A6", gradient: "linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)" },
  { name: "Orange", value: "#EA580C", gradient: "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)" },
  { name: "Cyan", value: "#06B6D4", gradient: "linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)" },
  { name: "Lime", value: "#84CC16", gradient: "linear-gradient(135deg, #84CC16 0%, #65A30D 100%)" },
  { name: "Violet", value: "#7C3AED", gradient: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)" },
  { name: "Fuchsia", value: "#C026D3", gradient: "linear-gradient(135deg, #C026D3 0%, #A21CAF 100%)" },
  { name: "Slate", value: "#64748B", gradient: "linear-gradient(135deg, #64748B 0%, #475569 100%)" },
  { name: "Gray", value: "#6B7280", gradient: "linear-gradient(135deg, #6B7280 0%, #4B5563 100%)" },
];

const ADVANCED_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8",
  "#F7DC6F", "#BB8FCE", "#85C1E9", "#F8C471", "#82E0AA", "#F1948A", "#85929E",
  "#A569BD", "#5DADE2", "#58D68D", "#F4D03F", "#EB984E", "#AED6F1", "#A3E4D7",
  "#D7BDE2", "#F9E79F", "#FADBD8", "#D5DBDB", "#154360", "#0E4B99", "#1B4F72",
  "#0B5345", "#784212", "#6C3483", "#A04000", "#922B21", "#515A5A", "#283747"
];

export function ColorPicker({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  label,
  placeholder = "Select color",
  disabled = false,
  className,
  size = "md",
  showInput = true,
  showPresets = true,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCustomColor(value);
  }, [value]);

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-6 w-6";
      case "lg":
        return "h-12 w-12";
      default:
        return "h-8 w-8";
    }
  };

  const handleColorSelect = (color: string) => {
    onChange(color);
    setCustomColor(color);
    setOpen(false);
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    onChange(color);
  };

  const isValidHex = (hex: string) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
  };

  const formatHexColor = (hex: string) => {
    if (!hex.startsWith('#')) {
      hex = '#' + hex;
    }
    return hex.toUpperCase();
  };

  const getPresetName = () => {
    const preset = presets.find(p => p.value === value);
    return preset ? preset.name : value;
  };

  const isPresetSelected = (presetValue: string) => {
    return value === presetValue;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start gap-2 h-auto p-2",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div
              className={cn(
                "rounded-full border-2 border-white shadow-sm flex-shrink-0",
                getSizeClasses()
              )}
              style={{ backgroundColor: value }}
            />
            <div className="flex-1 text-left">
              <div className="font-medium">{getPresetName()}</div>
              {showInput && (
                <div className="text-xs text-muted-foreground">{value}</div>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            {/* Custom Color Input */}
            {showInput && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Custom Color</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      ref={inputRef}
                      value={customColor}
                      onChange={(e) => {
                        const color = formatHexColor(e.target.value);
                        setCustomColor(color);
                        if (isValidHex(color)) {
                          onChange(color);
                        }
                      }}
                      placeholder="#3B82F6"
                      className="pl-8"
                    />
                    <div
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: isValidHex(customColor) ? customColor : '#ffffff' }}
                    />
                  </div>
                  <input
                    type="color"
                    value={isValidHex(customColor) ? customColor : '#3B82F6'}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    className="w-10 h-10 rounded border border-input bg-transparent cursor-pointer"
                    title="Color picker"
                  />
                </div>
              </div>
            )}

            {/* Preset Colors */}
            {showPresets && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Preset Colors</Label>
                <div className="grid grid-cols-8 gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handleColorSelect(preset.value)}
                      className={cn(
                        "relative w-8 h-8 rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                        isPresetSelected(preset.value)
                          ? "border-foreground scale-110"
                          : "border-border hover:border-muted-foreground"
                      )}
                      style={{ 
                        background: preset.gradient || preset.value 
                      }}
                      title={preset.name}
                    >
                      {isPresetSelected(preset.value) && (
                        <Check className="h-3 w-3 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 drop-shadow-sm" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Advanced Colors */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">More Colors</Label>
              <div className="grid grid-cols-10 gap-1">
                {ADVANCED_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={cn(
                      "relative w-6 h-6 rounded border transition-all hover:scale-110 focus:outline-none focus:ring-1 focus:ring-ring",
                      isPresetSelected(color)
                        ? "border-foreground scale-110"
                        : "border-border/50"
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {isPresetSelected(color) && (
                      <Check className="h-2 w-2 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 drop-shadow-sm" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
