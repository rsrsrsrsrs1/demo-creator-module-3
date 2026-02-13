"use client"

import { useEffect, useCallback } from "react"
import { useDemoStore } from "../store"

export function useKeyboard(
  callbacks: {
    onPlayPause?: () => void
    onStepForward?: () => void
    onStepBackward?: () => void
    onDelete?: () => void
    onEscape?: () => void
  }
) {
  const undo = useDemoStore((s) => s.undo)
  const redo = useDemoStore((s) => s.redo)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't capture when user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

      const isMod = e.metaKey || e.ctrlKey

      switch (e.key) {
        case " ":
          e.preventDefault()
          callbacks.onPlayPause?.()
          break
        case "j":
        case "J":
          if (!isMod) {
            e.preventDefault()
            callbacks.onStepBackward?.()
          }
          break
        case "k":
        case "K":
          if (!isMod) {
            e.preventDefault()
            callbacks.onStepForward?.()
          }
          break
        case "z":
          if (isMod && e.shiftKey) {
            e.preventDefault()
            redo()
          } else if (isMod) {
            e.preventDefault()
            undo()
          }
          break
        case "Delete":
        case "Backspace":
          if (!isMod) {
            e.preventDefault()
            callbacks.onDelete?.()
          }
          break
        case "Escape":
          callbacks.onEscape?.()
          break
      }
    },
    [callbacks, undo, redo]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])
}
