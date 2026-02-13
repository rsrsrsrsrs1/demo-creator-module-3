// All data model types from the Demo Creator specification (Section 3)

export type DemoScript = {
  version: 1
  createdAt: string // ISO 8601
  seed: number // uint32
  env: ScriptEnv
  meta?: ScriptMeta
  steps: DemoStep[]
}

export type ScriptEnv = {
  viewportWidth: number // px, integer
  viewportHeight: number // px, integer
  devicePixelRatio: number
}

export type ScriptMeta = {
  title?: string
  description?: string
  author?: string
}

export type DemoStep = ClickStep | PauseStep

export type ClickStep = {
  id: string // nanoid
  kind: "click"
  delayBeforeMs: number // >= 0
  stepSeed?: number // uint32 override
  clickType: "left" | "right" | "double"
  target: StepTarget
  fallback: StepFallback
  scroll: StepScroll
  motion: StepMotion
  fx: StepFx
}

export type PauseStep = {
  id: string
  kind: "pause"
  delayBeforeMs: number // >= 0
  stepSeed?: number
  durationMs: number // >= 0
  label?: string
}

export type StepTarget = {
  demoId?: string // value of data-demo-id attribute
  selector?: string // CSS selector
}

export type StepFallback = {
  xNorm: number // 0..1, relative to viewport width
  yNorm: number // 0..1, relative to viewport height
  bboxNorm: BboxNorm
  viewportWidth: number // viewport at capture time
  viewportHeight: number
}

export type BboxNorm = {
  left: number // 0..1
  top: number // 0..1
  width: number // 0..1
  height: number // 0..1
}

export type StepScroll = {
  winX: number // window.scrollX at capture
  winY: number // window.scrollY at capture
  container?: ScrollContainer
}

export type ScrollContainer = {
  demoId?: string
  selector?: string
  scrollLeft: number
  scrollTop: number
}

export type StepMotion = {
  durationMs: number // >= 50
  easing: EasingDef
  pathStyle: "natural" | "direct"
  jitterPx: number // >= 0
  overshootPx: number // >= 0
}

export type EasingDef =
  | { preset: "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear" }
  | { cubicBezier: [number, number, number, number] }

export type StepFx = {
  highlight: boolean
  highlightMs: number // >= 0
}

// Default motion values applied during recording
export const DEFAULT_MOTION: StepMotion = {
  durationMs: 600,
  easing: { preset: "ease-in-out" },
  pathStyle: "natural",
  jitterPx: 2,
  overshootPx: 4,
}

export const DEFAULT_FX: StepFx = {
  highlight: true,
  highlightMs: 300,
}
