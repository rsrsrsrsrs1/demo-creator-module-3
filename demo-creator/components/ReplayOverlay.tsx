"use client"

import { useCallback, useState } from "react"
import { CursorRenderer } from "./CursorRenderer"
import { HighlightRing } from "./HighlightRing"
import { useReplayClock } from "../hooks/useReplayClock"
import { useDemoStore } from "../store"

type HighlightState = {
  x: number
  y: number
  durationMs: number
  key: number
}

export function ReplayOverlay() {
  const replayState = useDemoStore((s) => s.replayState)
  const {
    clockState,
    play,
    pause,
    restart,
    seek,
    stepForward,
    stepBackward,
    totalDuration,
  } = useReplayClock()

  const [highlights, setHighlights] = useState<HighlightState[]>([])
  const [highlightKey, setHighlightKey] = useState(0)

  const removeHighlight = useCallback((key: number) => {
    setHighlights((prev) => prev.filter((h) => h.key !== key))
  }, [])

  const showOverlay = replayState !== "stopped"

  return (
    <>
      <CursorRenderer
        x={clockState.cursorPos.x}
        y={clockState.cursorPos.y}
        visible={showOverlay}
      />
      {highlights.map((h) => (
        <HighlightRing
          key={h.key}
          x={h.x}
          y={h.y}
          durationMs={h.durationMs}
          onComplete={() => removeHighlight(h.key)}
        />
      ))}
      {/* Expose controls via a ref-like pattern — the parent toolbar drives these */}
      <ReplayControlsBridge
        play={play}
        pause={pause}
        restart={restart}
        seek={seek}
        stepForward={stepForward}
        stepBackward={stepBackward}
        totalDuration={totalDuration}
        clockState={clockState}
      />
    </>
  )
}

// This component syncs replay controls to a global ref so the toolbar can use them
import { useEffect, useRef } from "react"
import type { ClockState } from "../hooks/useReplayClock"

export const replayControlsRef: {
  current: {
    play: () => void
    pause: () => void
    restart: () => void
    seek: (t: number) => void
    stepForward: () => void
    stepBackward: () => void
    totalDuration: number
    clockState: ClockState
  } | null
} = { current: null }

function ReplayControlsBridge(props: {
  play: () => void
  pause: () => void
  restart: () => void
  seek: (t: number) => void
  stepForward: () => void
  stepBackward: () => void
  totalDuration: number
  clockState: ClockState
}) {
  useEffect(() => {
    replayControlsRef.current = props
    return () => {
      replayControlsRef.current = null
    }
  })
  return null
}
