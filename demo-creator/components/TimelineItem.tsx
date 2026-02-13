"use client"

import { memo } from "react"
import type { DemoStep } from "../types/script"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MousePointerClick,
  Clock,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

type TimelineItemProps = {
  step: DemoStep
  index: number
  isSelected: boolean
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
  onDragStart: (e: React.PointerEvent) => void
}

function getStepLabel(step: DemoStep): string {
  if (step.kind === "pause") {
    return step.label || "Pause"
  }
  if (step.target.demoId) {
    return step.target.demoId
  }
  if (step.target.selector) {
    const sel = step.target.selector
    return sel.length > 24 ? sel.slice(0, 24) + "..." : sel
  }
  return "Click"
}

function getStepDuration(step: DemoStep): number {
  if (step.kind === "pause") {
    return step.delayBeforeMs + step.durationMs
  }
  return step.delayBeforeMs + step.motion.durationMs
}

function TimelineItemInner({
  step,
  index,
  isSelected,
  isActive,
  onSelect,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  onDragStart,
}: TimelineItemProps) {
  const duration = getStepDuration(step)

  return (
    <div
      role="option"
      aria-selected={isSelected}
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors",
        isSelected
          ? "bg-accent text-accent-foreground"
          : "hover:bg-muted/50",
        isActive && "ring-1 ring-ring"
      )}
      onClick={onSelect}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      {/* Drag handle */}
      <button
        className="cursor-grab opacity-0 group-hover:opacity-60 group-focus-within:opacity-60 touch-none"
        onPointerDown={onDragStart}
        aria-label={`Drag step ${index + 1}`}
        tabIndex={-1}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {/* Icon */}
      {step.kind === "click" ? (
        <MousePointerClick className="h-3.5 w-3.5 shrink-0 text-foreground" />
      ) : (
        <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      )}

      {/* Label */}
      <span className="flex-1 truncate text-xs">
        {getStepLabel(step)}
      </span>

      {/* Duration badge */}
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-mono">
        {duration >= 1000
          ? `${(duration / 1000).toFixed(1)}s`
          : `${Math.round(duration)}ms`}
      </Badge>

      {/* Move up/down buttons (for keyboard accessibility) */}
      <div className="flex flex-col opacity-0 focus-within:opacity-100 group-focus-within:opacity-100">
        <button
          className="p-0 h-3 disabled:opacity-30"
          onClick={(e) => {
            e.stopPropagation()
            onMoveUp()
          }}
          disabled={isFirst}
          aria-label="Move step up"
          tabIndex={0}
        >
          <ChevronUp className="h-3 w-3 text-muted-foreground" />
        </button>
        <button
          className="p-0 h-3 disabled:opacity-30"
          onClick={(e) => {
            e.stopPropagation()
            onMoveDown()
          }}
          disabled={isLast}
          aria-label="Move step down"
          tabIndex={0}
        >
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>

      {/* Delete */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        aria-label={`Delete step ${index + 1}`}
      >
        <Trash2 className="h-3 w-3 text-muted-foreground" />
      </Button>
    </div>
  )
}

export const TimelineItem = memo(TimelineItemInner)
