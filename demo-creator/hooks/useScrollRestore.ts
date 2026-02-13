"use client"

import { useCallback } from "react"
import type { StepScroll } from "../types/script"

function resolveScrollContainer(container: NonNullable<StepScroll["container"]>): Element | null {
  if (container.demoId) {
    try {
      const el = document.querySelector(`[data-demo-id="${container.demoId}"]`)
      if (el) return el
    } catch {
      // continue
    }
  }
  if (container.selector) {
    try {
      const el = document.querySelector(container.selector)
      if (el) return el
    } catch {
      // continue
    }
  }
  return null
}

export function useScrollRestore() {
  const restore = useCallback((scroll: StepScroll) => {
    // 1. Restore scroll container first
    if (scroll.container) {
      const el = resolveScrollContainer(scroll.container)
      if (el) {
        el.scrollLeft = scroll.container.scrollLeft
        el.scrollTop = scroll.container.scrollTop
      }
    }

    // 2. Restore window scroll
    window.scrollTo({
      left: scroll.winX,
      top: scroll.winY,
      behavior: "instant" as ScrollBehavior,
    })
  }, [])

  return { restoreScroll: restore }
}
