"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { EasingDef } from "../types/script"

const PRESETS = ["ease", "ease-in", "ease-out", "ease-in-out", "linear"] as const

type EasingEditorProps = {
  value: EasingDef
  onChange: (value: EasingDef) => void
}

export function EasingEditor({ value, onChange }: EasingEditorProps) {
  const isPreset = "preset" in value
  const currentPreset = isPreset ? value.preset : "custom"
  const bezierValues: [number, number, number, number] =
    "cubicBezier" in value ? value.cubicBezier : [0.42, 0, 0.58, 1]

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    if (v === "custom") {
      onChange({ cubicBezier: [0.42, 0, 0.58, 1] })
    } else {
      onChange({ preset: v as (typeof PRESETS)[number] })
    }
  }

  const handleBezierChange = (index: number, val: string) => {
    const num = parseFloat(val)
    if (isNaN(num)) return
    const clamped = Math.min(Math.max(num, -2), 2)
    const newBezier = [...bezierValues] as [number, number, number, number]
    newBezier[index] = Math.round(clamped * 100) / 100
    onChange({ cubicBezier: newBezier })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="easing-preset" className="text-xs text-muted-foreground shrink-0">
          Easing
        </Label>
        <select
          id="easing-preset"
          value={currentPreset}
          onChange={handlePresetChange}
          className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {PRESETS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
      </div>

      {!isPreset && (
        <div className="grid grid-cols-4 gap-1">
          {["x1", "y1", "x2", "y2"].map((label, i) => (
            <div key={label} className="flex flex-col gap-0.5">
              <Label className="text-[10px] text-muted-foreground">{label}</Label>
              <Input
                type="number"
                step={0.01}
                min={-2}
                max={2}
                value={bezierValues[i]}
                onChange={(e) => handleBezierChange(i, e.target.value)}
                className="h-7 text-xs px-1.5"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
