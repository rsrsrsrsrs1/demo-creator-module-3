"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useDemoStore } from "../store"
import type { ClickStep, DemoStep } from "../types/script"
import { PRNG } from "../utilities/prng"
import { createPathSampler, type PathSampler, type Point } from "../utilities/pathMath"
import { resolveTarget } from "./useTargetResolver"
import { clamp } from "../utilities/clamp"

export type ClockState = {
  currentTimeMs: number
  activeStepIndex: number
  cursorPos: Point
  isHighlighting: boolean
  highlightPos: Point | null
  totalDurationMs: number
}

type StepTimeRange = {
  startMs: number
  endMs: number
  step: DemoStep
}

function computeStepRanges(steps: DemoStep[]): StepTimeRange[] {
  const ranges: StepTimeRange[] = []
  let cursor = 0
  for (const step of steps) {
    const start = cursor
    const delay = step.delayBeforeMs ?? 0
    let dur = delay
    if (step.kind === "click") {
      dur += step.motion.durationMs
    } else {
      dur += step.durationMs
    }
    ranges.push({ startMs: start, endMs: start + dur, step })
    cursor = start + dur
  }
  return ranges
}

function getReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function useReplayClock() {
  const script = useDemoStore((s) => s.script)
  const replayState = useDemoStore((s) => s.replayState)
  const replaySpeed = useDemoStore((s) => s.replaySpeed)
  const setReplayState = useDemoStore((s) => s.setReplayState)

  const [clockState, setClockState] = useState<ClockState>({
    currentTimeMs: 0,
    activeStepIndex: -1,
    cursorPos: { x: -100, y: -100 },
    isHighlighting: false,
    highlightPos: null,
    totalDurationMs: 0,
  })

  const rafRef = useRef<number>(0)
  const lastFrameRef = useRef<number>(0)
  const currentTimeMsRef = useRef(0)
  const pathSamplerRef = useRef<PathSampler | null>(null)
  const prevStepIndexRef = useRef(-1)
  const prevPosRef = useRef<Point>({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const prngRef = useRef<PRNG | null>(null)
  const stepRangesRef = useRef<StepTimeRange[]>([])
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Compute step ranges when script changes
  useEffect(() => {
    if (script) {
      stepRangesRef.current = computeStepRanges(script.steps)
    } else {
      stepRangesRef.current = []
    }
  }, [script])

  const totalDuration = script
    ? stepRangesRef.current.length > 0
      ? stepRangesRef.current[stepRangesRef.current.length - 1].endMs
      : 0
    : 0

  const tick = useCallback(
    (now: number) => {
      if (!script || replayState !== "playing") return

      const delta = lastFrameRef.current > 0 ? now - lastFrameRef.current : 0
      lastFrameRef.current = now
      const dt = delta * replaySpeed

      currentTimeMsRef.current += dt
      const t = currentTimeMsRef.current
      const ranges = stepRangesRef.current
      const reducedMotion = getReducedMotion()

      // Find active step
      let activeIdx = -1
      for (let i = 0; i < ranges.length; i++) {
        if (t >= ranges[i].startMs && t < ranges[i].endMs) {
          activeIdx = i
          break
        }
      }

      // If past all steps, stop
      if (t >= totalDuration && totalDuration > 0) {
        setReplayState("stopped")
        const lastRange = ranges[ranges.length - 1]
        if (lastRange && lastRange.step.kind === "click") {
          const resolved = resolveTarget(lastRange.step)
          setClockState((prev) => ({
            ...prev,
            currentTimeMs: totalDuration,
            activeStepIndex: ranges.length - 1,
            cursorPos: { x: resolved.x, y: resolved.y },
            isHighlighting: false,
            highlightPos: null,
            totalDurationMs: totalDuration,
          }))
        }
        return
      }

      if (activeIdx === -1) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const range = ranges[activeIdx]
      const step = range.step

      // Step transition: resolve new target and create path
      if (activeIdx !== prevStepIndexRef.current) {
        prevStepIndexRef.current = activeIdx

        if (step.kind === "click") {
          // Restore scroll
          window.scrollTo({
            left: step.scroll.winX,
            top: step.scroll.winY,
            behavior: "instant" as ScrollBehavior,
          })
          if (step.scroll.container) {
            const containerSel = step.scroll.container.demoId
              ? `[data-demo-id="${step.scroll.container.demoId}"]`
              : step.scroll.container.selector
            if (containerSel) {
              try {
                const containerEl = document.querySelector(containerSel)
                if (containerEl) {
                  containerEl.scrollLeft = step.scroll.container.scrollLeft
                  containerEl.scrollTop = step.scroll.container.scrollTop
                }
              } catch {
                // ignore
              }
            }
          }

          const resolved = resolveTarget(step)
          const start = { ...prevPosRef.current }
          const end = { x: resolved.x, y: resolved.y }

          // Fork PRNG for this step
          if (!prngRef.current) {
            prngRef.current = new PRNG(script.seed)
          }
          const stepRng = step.stepSeed !== undefined
            ? new PRNG(step.stepSeed)
            : prngRef.current.fork()

          const motion = reducedMotion
            ? {
                ...step.motion,
                jitterPx: 0,
                overshootPx: 0,
                pathStyle: "direct" as const,
                durationMs: Math.min(step.motion.durationMs, 150),
              }
            : step.motion

          pathSamplerRef.current = createPathSampler(start, end, motion, stepRng, reducedMotion)
        } else {
          pathSamplerRef.current = null
        }
      }

      // Sample position
      let pos = prevPosRef.current
      if (step.kind === "click" && pathSamplerRef.current) {
        const localT = t - range.startMs
        const delay = step.delayBeforeMs ?? 0
        const motionDur = reducedMotion
          ? Math.min(step.motion.durationMs, 150)
          : step.motion.durationMs

        if (localT < delay) {
          // Still in delay phase, cursor stays at previous position
          pos = prevPosRef.current
        } else {
          const motionT = clamp((localT - delay) / motionDur, 0, 1)
          pos = pathSamplerRef.current(motionT)

          if (motionT >= 1) {
            prevPosRef.current = pos

            // Trigger highlight FX
            if (step.fx.highlight && step.fx.highlightMs > 0) {
              setClockState((prev) => ({
                ...prev,
                isHighlighting: true,
                highlightPos: { ...pos },
              }))
              if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
              highlightTimerRef.current = setTimeout(() => {
                setClockState((prev) => ({
                  ...prev,
                  isHighlighting: false,
                  highlightPos: null,
                }))
              }, step.fx.highlightMs)
            }
          }
        }
      }

      setClockState({
        currentTimeMs: t,
        activeStepIndex: activeIdx,
        cursorPos: pos,
        isHighlighting: false,
        highlightPos: null,
        totalDurationMs: totalDuration,
      })

      rafRef.current = requestAnimationFrame(tick)
    },
    [script, replayState, replaySpeed, setReplayState, totalDuration]
  )

  // Start/stop rAF loop
  useEffect(() => {
    if (replayState === "playing" && script) {
      lastFrameRef.current = 0

      // Initialize PRNG at play start if from the beginning
      if (currentTimeMsRef.current === 0) {
        prngRef.current = new PRNG(script.seed)
        prevStepIndexRef.current = -1
        prevPosRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      }

      rafRef.current = requestAnimationFrame(tick)
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
      }
    }
  }, [replayState, script, tick])

  const play = useCallback(() => {
    if (!script || script.steps.length === 0) return
    if (replayState === "stopped") {
      currentTimeMsRef.current = 0
      prevStepIndexRef.current = -1
      prngRef.current = new PRNG(script.seed)
      prevPosRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    }
    setReplayState("playing")
  }, [script, replayState, setReplayState])

  const pause = useCallback(() => {
    setReplayState("paused")
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [setReplayState])

  const restart = useCallback(() => {
    currentTimeMsRef.current = 0
    prevStepIndexRef.current = -1
    prevPosRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    if (script) {
      prngRef.current = new PRNG(script.seed)
    }
    setReplayState("playing")
  }, [script, setReplayState])

  const seek = useCallback(
    (timeMs: number) => {
      currentTimeMsRef.current = clamp(timeMs, 0, totalDuration)
      prevStepIndexRef.current = -1 // force re-resolve
    },
    [totalDuration]
  )

  const stepForward = useCallback(() => {
    const ranges = stepRangesRef.current
    const current = currentTimeMsRef.current
    for (let i = 0; i < ranges.length; i++) {
      if (ranges[i].startMs > current) {
        seek(ranges[i].startMs)
        return
      }
    }
  }, [seek])

  const stepBackward = useCallback(() => {
    const ranges = stepRangesRef.current
    const current = currentTimeMsRef.current
    for (let i = ranges.length - 1; i >= 0; i--) {
      if (ranges[i].startMs < current - 10) {
        seek(ranges[i].startMs)
        return
      }
    }
    seek(0)
  }, [seek])

  return {
    clockState,
    play,
    pause,
    restart,
    seek,
    stepForward,
    stepBackward,
    totalDuration,
  }
}
