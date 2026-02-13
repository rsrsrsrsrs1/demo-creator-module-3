"use client"

import { useCallback } from "react"
import type { ClickStep } from "../types/script"
import { normBboxCenter } from "../utilities/normalizeCoords"

export type ResolvedTarget = {
  x: number
  y: number
  element: Element | null
  method: "demoId" | "selector" | "bboxCenter" | "fallbackPoint"
}

function isVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return false
  const style = getComputedStyle(el)
  return style.display !== "none"
}

export function resolveTarget(step: ClickStep): ResolvedTarget {
  const vw = window.innerWidth
  const vh = window.innerHeight

  // 1. Try data-demo-id
  if (step.target.demoId) {
    try {
      const el = document.querySelector(`[data-demo-id="${step.target.demoId}"]`)
      if (el && isVisible(el)) {
        const rect = el.getBoundingClientRect()
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          element: el,
          method: "demoId",
        }
      }
    } catch {
      // invalid selector, continue
    }
  }

  // 2. Try CSS selector
  if (step.target.selector) {
    try {
      const el = document.querySelector(step.target.selector)
      if (el && isVisible(el)) {
        const rect = el.getBoundingClientRect()
        const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }

        // Check if the first match is >200px from fallback point
        const fallbackX = step.fallback.xNorm * vw
        const fallbackY = step.fallback.yNorm * vh
        const dist = Math.sqrt(
          (center.x - fallbackX) ** 2 + (center.y - fallbackY) ** 2
        )
        if (dist > 200) {
          // Fall through to fallback
        } else {
          return { x: center.x, y: center.y, element: el, method: "selector" }
        }
      }
    } catch {
      // invalid selector
    }
  }

  // 3. Fallback bbox center
  const bboxCenter = normBboxCenter(step.fallback.bboxNorm, vw, vh)
  if (
    bboxCenter.x >= 0 &&
    bboxCenter.x <= vw &&
    bboxCenter.y >= 0 &&
    bboxCenter.y <= vh
  ) {
    return {
      x: bboxCenter.x,
      y: bboxCenter.y,
      element: null,
      method: "bboxCenter",
    }
  }

  // 4. Fallback point
  return {
    x: step.fallback.xNorm * vw,
    y: step.fallback.yNorm * vh,
    element: null,
    method: "fallbackPoint",
  }
}

export function useTargetResolver() {
  const resolve = useCallback((step: ClickStep) => resolveTarget(step), [])
  return { resolveTarget: resolve }
}
