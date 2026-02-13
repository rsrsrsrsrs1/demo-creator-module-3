"use client"

import { memo } from "react"

type CursorRendererProps = {
  x: number
  y: number
  visible: boolean
}

function CursorRendererInner({ x, y, visible }: CursorRendererProps) {
  if (!visible) return null

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        transform: `translate3d(${x}px, ${y}px, 0)`,
        pointerEvents: "none",
        zIndex: 2147483647,
        width: 24,
        height: 24,
        willChange: "transform",
      }}
      aria-hidden="true"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.5 3L19 12.5L12.5 13.5L9.5 20L5.5 3Z"
          fill="hsl(0, 0%, 9%)"
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

export const CursorRenderer = memo(CursorRendererInner)
