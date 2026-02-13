"use client"

import { useDemoStore } from "../store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { EasingEditor } from "./EasingEditor"
import type { ClickStep, PauseStep, EasingDef } from "../types/script"
import { clamp } from "../utilities/clamp"
import { Eye } from "lucide-react"

export function StepInspector() {
  const selectedStepId = useDemoStore((s) => s.selectedStepId)
  const script = useDemoStore((s) => s.script)
  const updateStep = useDemoStore((s) => s.updateStep)

  const step = script?.steps.find((s) => s.id === selectedStepId)

  if (!step) {
    return (
      <div className="flex items-center justify-center h-full px-4 text-center">
        <p className="text-sm text-muted-foreground">
          Select a step to inspect its properties.
        </p>
      </div>
    )
  }

  if (step.kind === "pause") {
    return <PauseInspector step={step} onUpdate={updateStep} />
  }

  return <ClickInspector step={step} onUpdate={updateStep} />
}

function PauseInspector({
  step,
  onUpdate,
}: {
  step: PauseStep
  onUpdate: (id: string, patch: Partial<PauseStep>) => void
}) {
  return (
    <div className="flex flex-col gap-3 p-3">
      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
        Pause Step
      </h3>

      <FieldRow label="Delay Before (ms)">
        <Input
          type="number"
          min={0}
          max={60000}
          value={step.delayBeforeMs}
          onChange={(e) =>
            onUpdate(step.id, {
              delayBeforeMs: clamp(parseInt(e.target.value) || 0, 0, 60000),
            })
          }
          onBlur={(e) =>
            onUpdate(step.id, {
              delayBeforeMs: clamp(parseInt(e.target.value) || 0, 0, 60000),
            })
          }
          className="h-7 text-xs"
        />
      </FieldRow>

      <FieldRow label="Duration (ms)">
        <Input
          type="number"
          min={0}
          max={60000}
          value={step.durationMs}
          onChange={(e) =>
            onUpdate(step.id, {
              durationMs: clamp(parseInt(e.target.value) || 0, 0, 60000),
            })
          }
          onBlur={(e) =>
            onUpdate(step.id, {
              durationMs: clamp(parseInt(e.target.value) || 0, 0, 60000),
            })
          }
          className="h-7 text-xs"
        />
      </FieldRow>

      <FieldRow label="Label">
        <Input
          type="text"
          maxLength={100}
          value={step.label ?? ""}
          onChange={(e) =>
            onUpdate(step.id, { label: e.target.value.slice(0, 100) })
          }
          placeholder="Optional label"
          className="h-7 text-xs"
        />
      </FieldRow>
    </div>
  )
}

function ClickInspector({
  step,
  onUpdate,
}: {
  step: ClickStep
  onUpdate: (id: string, patch: Partial<ClickStep>) => void
}) {
  const updateMotion = (patch: Partial<ClickStep["motion"]>) => {
    onUpdate(step.id, { motion: { ...step.motion, ...patch } } as Partial<ClickStep>)
  }

  const updateFx = (patch: Partial<ClickStep["fx"]>) => {
    onUpdate(step.id, { fx: { ...step.fx, ...patch } } as Partial<ClickStep>)
  }

  return (
    <div className="flex flex-col gap-3 p-3 overflow-y-auto">
      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
        Click Step
      </h3>

      {/* Target info (read-only) */}
      <div className="rounded-md border border-border bg-muted/30 p-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
          Target
        </p>
        {step.target.demoId && (
          <p className="text-xs font-mono truncate">
            <span className="text-muted-foreground">data-demo-id: </span>
            {step.target.demoId}
          </p>
        )}
        {step.target.selector && (
          <p className="text-xs font-mono truncate">
            <span className="text-muted-foreground">selector: </span>
            {step.target.selector}
          </p>
        )}
      </div>

      <FieldRow label="Delay Before (ms)">
        <Input
          type="number"
          min={0}
          max={60000}
          value={step.delayBeforeMs}
          onChange={(e) =>
            onUpdate(step.id, {
              delayBeforeMs: clamp(parseInt(e.target.value) || 0, 0, 60000),
            })
          }
          className="h-7 text-xs"
        />
      </FieldRow>

      <FieldRow label="Click Type">
        <select
          value={step.clickType}
          onChange={(e) =>
            onUpdate(step.id, {
              clickType: e.target.value as "left" | "right" | "double",
            })
          }
          className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="left">Left</option>
          <option value="right">Right</option>
          <option value="double">Double</option>
        </select>
      </FieldRow>

      <div className="border-t border-border pt-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
          Motion
        </p>

        <div className="flex flex-col gap-2">
          <FieldRow label="Duration (ms)">
            <Input
              type="number"
              min={50}
              max={60000}
              value={step.motion.durationMs}
              onChange={(e) =>
                updateMotion({
                  durationMs: clamp(parseInt(e.target.value) || 600, 50, 60000),
                })
              }
              className="h-7 text-xs"
            />
          </FieldRow>

          <EasingEditor
            value={step.motion.easing}
            onChange={(easing: EasingDef) => updateMotion({ easing })}
          />

          <FieldRow label="Path Style">
            <div className="flex items-center gap-2">
              <button
                className={`px-2 py-0.5 rounded text-xs border ${
                  step.motion.pathStyle === "natural"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-input"
                }`}
                onClick={() => updateMotion({ pathStyle: "natural" })}
              >
                Natural
              </button>
              <button
                className={`px-2 py-0.5 rounded text-xs border ${
                  step.motion.pathStyle === "direct"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-input"
                }`}
                onClick={() => updateMotion({ pathStyle: "direct" })}
              >
                Direct
              </button>
            </div>
          </FieldRow>

          <FieldRow label="Jitter (px)">
            <Input
              type="number"
              min={0}
              max={50}
              step={0.5}
              value={step.motion.jitterPx}
              onChange={(e) =>
                updateMotion({
                  jitterPx: clamp(parseFloat(e.target.value) || 0, 0, 50),
                })
              }
              className="h-7 text-xs"
            />
          </FieldRow>

          <FieldRow label="Overshoot (px)">
            <Input
              type="number"
              min={0}
              max={100}
              step={1}
              value={step.motion.overshootPx}
              onChange={(e) =>
                updateMotion({
                  overshootPx: clamp(parseFloat(e.target.value) || 0, 0, 100),
                })
              }
              className="h-7 text-xs"
            />
          </FieldRow>
        </div>
      </div>

      <div className="border-t border-border pt-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
          Effects
        </p>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={step.fx.highlight}
              onCheckedChange={(checked) => updateFx({ highlight: checked })}
              id="fx-highlight"
            />
            <Label htmlFor="fx-highlight" className="text-xs">
              Highlight Ring
            </Label>
          </div>

          {step.fx.highlight && (
            <FieldRow label="Highlight (ms)">
              <Input
                type="number"
                min={0}
                max={5000}
                value={step.fx.highlightMs}
                onChange={(e) =>
                  updateFx({
                    highlightMs: clamp(parseInt(e.target.value) || 0, 0, 5000),
                  })
                }
                className="h-7 text-xs"
              />
            </FieldRow>
          )}
        </div>
      </div>
    </div>
  )
}

function FieldRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs text-muted-foreground shrink-0 w-28">
        {label}
      </Label>
      <div className="flex-1">{children}</div>
    </div>
  )
}
