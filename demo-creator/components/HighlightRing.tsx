"use client"

import { useEffect, useState } from "react"

type HighlightRingProps = {
  x: number
  y: number
  durationMs: number
  onComplete: () => void
}

export function HighlightRing({ x, y, durationMs, onComplete }: HighlightRingProps) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    // Trigger animation on next frame
    requestAnimationFrame(() => setActive(true))
    const timer = setTimeout(onComplete, durationMs)
    return () => clearTimeout(timer)
  }, [durationMs, onComplete])

  return (
    <div
      style={{
        position: "fixed",
        left: x - 20,
        top: y - 20,
        width: 40,
        height: 40,
        pointerEvents: "none",
        zIndex: 2147483646,
      }}
      aria-hidden="true"
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          border: "2px solid hsl(0, 0%, 9%)",
          transform: active ? "scale(1)" : "scale(0)",
          opacity: active ? 0 : 1,
          transition: `transform ${durationMs}ms ease-out, opacity ${durationMs}ms ease-out`,
        }}
      />
    </div>
  )
}
