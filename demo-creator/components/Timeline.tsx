"use client"

import { useCallback, useRef, useState } from "react"
import { useDemoStore } from "../store"
import { TimelineItem } from "./TimelineItem"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { generateStepId } from "../utilities/idGenerator"
import type { PauseStep } from "../types/script"
import { replayControlsRef } from "./ReplayOverlay"

export function Timeline() {
  const script = useDemoStore((s) => s.script)
  const selectedStepId = useDemoStore((s) => s.selectedStepId)
  const selectStep = useDemoStore((s) => s.selectStep)
  const removeStep = useDemoStore((s) => s.removeStep)
  const reorderStep = useDemoStore((s) => s.reorderStep)
  const addStep = useDemoStore((s) => s.addStep)
  const activeStepIndex = replayControlsRef.current?.clockState.activeStepIndex ?? -1

  const steps = script?.steps ?? []

  // Drag and drop state
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const dragStartY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleDragStart = useCallback(
    (index: number) => (e: React.PointerEvent) => {
      e.preventDefault()
      setDragIndex(index)
      dragStartY.current = e.clientY

      const handleMove = (moveE: PointerEvent) => {
        if (!containerRef.current) return
        const items = containerRef.current.querySelectorAll("[role='option']")
        let newDropIndex = index
        for (let i = 0; i < items.length; i++) {
          const rect = items[i].getBoundingClientRect()
          if (moveE.clientY < rect.top + rect.height / 2) {
            newDropIndex = i
            break
          }
          newDropIndex = i + 1
        }
        setDropIndex(Math.min(newDropIndex, steps.length - 1))
      }

      const handleUp = () => {
        document.removeEventListener("pointermove", handleMove)
        document.removeEventListener("pointerup", handleUp)
        setDragIndex(null)
        setDropIndex(null)
        if (dragIndex !== null && dropIndex !== null && dragIndex !== dropIndex) {
          reorderStep(dragIndex, dropIndex)
        }
      }

      document.addEventListener("pointermove", handleMove)
      document.addEventListener("pointerup", handleUp)
    },
    [dragIndex, dropIndex, reorderStep, steps.length]
  )

  const handleInsertPause = useCallback(
    (atIndex: number) => {
      const pause: PauseStep = {
        id: generateStepId(),
        kind: "pause",
        delayBeforeMs: 0,
        durationMs: 1000,
      }
      addStep(pause, atIndex)
    },
    [addStep]
  )

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center">
        <p className="text-sm text-muted-foreground">
          No steps recorded yet.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Click Record to start capturing clicks.
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      role="listbox"
      aria-label="Demo steps"
      className="flex flex-col gap-0.5 p-2 overflow-y-auto"
    >
      {steps.map((step, i) => (
        <div key={step.id}>
          {/* Drop indicator line */}
          {dragIndex !== null && dropIndex === i && dragIndex !== i && (
            <div className="h-0.5 bg-ring rounded-full mx-2 my-0.5" />
          )}

          <TimelineItem
            step={step}
            index={i}
            isSelected={selectedStepId === step.id}
            isActive={activeStepIndex === i}
            onSelect={() => selectStep(step.id)}
            onDelete={() => removeStep(step.id)}
            onMoveUp={() => {
              if (i > 0) reorderStep(i, i - 1)
            }}
            onMoveDown={() => {
              if (i < steps.length - 1) reorderStep(i, i + 1)
            }}
            isFirst={i === 0}
            isLast={i === steps.length - 1}
            onDragStart={handleDragStart(i)}
          />

          {/* Insert pause button between items */}
          {i < steps.length - 1 && (
            <div className="flex justify-center py-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
                onClick={() => handleInsertPause(i + 1)}
                aria-label={`Insert pause after step ${i + 1}`}
              >
                <Plus className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
