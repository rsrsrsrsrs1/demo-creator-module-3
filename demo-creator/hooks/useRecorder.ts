"use client"

import { useCallback, useEffect, useRef } from "react"
import { useDemoStore } from "../store"
import type { ClickStep, DemoScript } from "../types/script"
import { DEFAULT_MOTION, DEFAULT_FX } from "../types/script"
import { generateStepId, generateSeed } from "../utilities/idGenerator"
import { selectorBuilder } from "../utilities/selectorBuilder"
import { detectScrollContainer } from "../utilities/scrollDetector"
import { pixelToNorm, rectToNormBbox } from "../utilities/normalizeCoords"

export function useRecorder() {
  const recorderState = useDemoStore((s) => s.recorderState)
  const setRecorderState = useDemoStore((s) => s.setRecorderState)
  const addStep = useDemoStore((s) => s.addStep)
  const loadScript = useDemoStore((s) => s.loadScript)
  const script = useDemoStore((s) => s.script)
  const setReplayState = useDemoStore((s) => s.setReplayState)

  const stepsRef = useRef<ClickStep[]>([])
  const rootRef = useRef<Element | null>(null)

  // Set the root element reference so we can ignore clicks on it
  const setRootElement = useCallback((el: Element | null) => {
    rootRef.current = el
  }, [])

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      // Ignore right clicks for recording (we still record them as step data)
      // Only capture primary button presses for the actual recording trigger
      // But we do want to record the click type info

      const target = e.target as Element
      if (!target) return

      // Ignore clicks inside the demo-creator root
      const creatorRoot = rootRef.current ?? document.querySelector("[data-demo-creator-root]")
      if (creatorRoot && creatorRoot.contains(target)) return

      // Use composedPath to reach into open shadow DOM
      const path = e.composedPath()
      const actualTarget = (path[0] as Element) ?? target

      // Walk up to find data-demo-id
      let demoId: string | undefined
      let current: Element | null = actualTarget
      while (current) {
        const attr = current.getAttribute?.("data-demo-id")
        if (attr) {
          demoId = attr
          break
        }
        current = current.parentElement
      }

      const vw = window.innerWidth
      const vh = window.innerHeight

      const rect = actualTarget.getBoundingClientRect()
      const clientX = e.clientX
      const clientY = e.clientY

      const step: ClickStep = {
        id: generateStepId(),
        kind: "click",
        delayBeforeMs: 0,
        clickType: e.button === 2 ? "right" : "left",
        target: {
          demoId,
          selector: selectorBuilder(actualTarget),
        },
        fallback: {
          xNorm: pixelToNorm(clientX, vw),
          yNorm: pixelToNorm(clientY, vh),
          bboxNorm: rectToNormBbox(rect, vw, vh),
          viewportWidth: vw,
          viewportHeight: vh,
        },
        scroll: {
          winX: window.scrollX,
          winY: window.scrollY,
          container: detectScrollContainer(actualTarget),
        },
        motion: { ...DEFAULT_MOTION },
        fx: { ...DEFAULT_FX },
      }

      stepsRef.current.push(step)

      // If we already have a script (continuing recording), add to it
      if (useDemoStore.getState().script) {
        addStep(step)
      }
    },
    [addStep]
  )

  const startRecording = useCallback(() => {
    stepsRef.current = []
    setReplayState("stopped")

    // If no existing script, we'll create one on stop
    // If there's an existing script, we add to it
    if (!useDemoStore.getState().script) {
      stepsRef.current = []
    }

    setRecorderState("recording")
  }, [setRecorderState, setReplayState])

  const stopRecording = useCallback(() => {
    setRecorderState("idle")

    const existingScript = useDemoStore.getState().script
    if (!existingScript && stepsRef.current.length > 0) {
      // Create a new script from the recorded steps
      const newScript: DemoScript = {
        version: 1,
        createdAt: new Date().toISOString(),
        seed: generateSeed(),
        env: {
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio,
        },
        steps: stepsRef.current,
      }
      loadScript(newScript)
    }

    stepsRef.current = []
  }, [setRecorderState, loadScript])

  // Attach/detach the listener based on recorder state
  useEffect(() => {
    if (recorderState === "recording") {
      document.addEventListener("pointerdown", handlePointerDown, true)
      return () => {
        document.removeEventListener("pointerdown", handlePointerDown, true)
      }
    }
  }, [recorderState, handlePointerDown])

  return {
    recorderState,
    startRecording,
    stopRecording,
    setRootElement,
  }
}
