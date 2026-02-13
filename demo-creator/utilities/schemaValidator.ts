import type { DemoScript, DemoStep, ClickStep, PauseStep } from "../types/script"
import type { ValidationError } from "../types/editor"
import { clamp } from "./clamp"

/**
 * Validates and sanitizes a parsed JSON object against the DemoScript schema.
 * Returns either a validated + clamped DemoScript or an array of errors.
 */
export type ValidationResult =
  | { ok: true; script: DemoScript }
  | { ok: false; errors: ValidationError[] }

export function validateDemoScript(input: unknown): ValidationResult {
  const errors: ValidationError[] = []

  if (!input || typeof input !== "object") {
    return { ok: false, errors: [{ path: "", message: "Input must be an object" }] }
  }

  const raw = input as Record<string, unknown>

  // Version
  if (raw.version !== 1) {
    errors.push({ path: "version", message: "version must be exactly 1" })
  }

  // createdAt
  if (typeof raw.createdAt !== "string") {
    errors.push({ path: "createdAt", message: "createdAt must be a string (ISO 8601)" })
  }

  // seed
  if (typeof raw.seed !== "number" || !Number.isFinite(raw.seed)) {
    errors.push({ path: "seed", message: "seed must be a finite number" })
  }

  // env
  if (!raw.env || typeof raw.env !== "object") {
    errors.push({ path: "env", message: "env is required and must be an object" })
  } else {
    const env = raw.env as Record<string, unknown>
    if (typeof env.viewportWidth !== "number")
      errors.push({ path: "env.viewportWidth", message: "must be a number" })
    if (typeof env.viewportHeight !== "number")
      errors.push({ path: "env.viewportHeight", message: "must be a number" })
    if (typeof env.devicePixelRatio !== "number")
      errors.push({ path: "env.devicePixelRatio", message: "must be a number" })
  }

  // steps
  if (!Array.isArray(raw.steps)) {
    errors.push({ path: "steps", message: "steps must be an array" })
  } else {
    for (let i = 0; i < raw.steps.length; i++) {
      const step = raw.steps[i] as Record<string, unknown>
      if (!step || typeof step !== "object") {
        errors.push({ path: `steps[${i}]`, message: "each step must be an object" })
        continue
      }
      if (step.kind !== "click" && step.kind !== "pause") {
        errors.push({
          path: `steps[${i}].kind`,
          message: 'kind must be "click" or "pause"',
        })
      }
      if (typeof step.id !== "string") {
        errors.push({ path: `steps[${i}].id`, message: "id must be a string" })
      }
      if (step.kind === "click") {
        const cs = step as Record<string, unknown>
        if (!cs.target || typeof cs.target !== "object")
          errors.push({ path: `steps[${i}].target`, message: "target is required" })
        if (!cs.fallback || typeof cs.fallback !== "object")
          errors.push({ path: `steps[${i}].fallback`, message: "fallback is required" })
        if (!cs.scroll || typeof cs.scroll !== "object")
          errors.push({ path: `steps[${i}].scroll`, message: "scroll is required" })
        if (!cs.motion || typeof cs.motion !== "object")
          errors.push({ path: `steps[${i}].motion`, message: "motion is required" })
        if (!cs.fx || typeof cs.fx !== "object")
          errors.push({ path: `steps[${i}].fx`, message: "fx is required" })
      }
      if (step.kind === "pause") {
        if (typeof step.durationMs !== "number")
          errors.push({
            path: `steps[${i}].durationMs`,
            message: "durationMs is required for pause steps",
          })
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  // Clamp and construct the validated script
  const script = clampScript(raw as Record<string, unknown>)
  return { ok: true, script }
}

function clampScript(raw: Record<string, unknown>): DemoScript {
  const env = raw.env as Record<string, unknown>
  const meta = raw.meta as Record<string, unknown> | undefined

  const steps = (raw.steps as Record<string, unknown>[]).map((s) =>
    s.kind === "click" ? clampClickStep(s) : clampPauseStep(s)
  )

  return {
    version: 1,
    createdAt: raw.createdAt as string,
    seed: (raw.seed as number) >>> 0,
    env: {
      viewportWidth: Math.round(env.viewportWidth as number),
      viewportHeight: Math.round(env.viewportHeight as number),
      devicePixelRatio: env.devicePixelRatio as number,
    },
    meta: meta
      ? {
          title: typeof meta.title === "string" ? meta.title : undefined,
          description: typeof meta.description === "string" ? meta.description : undefined,
          author: typeof meta.author === "string" ? meta.author : undefined,
        }
      : undefined,
    steps,
  }
}

function clampClickStep(raw: Record<string, unknown>): ClickStep {
  const target = raw.target as Record<string, unknown>
  const fallback = raw.fallback as Record<string, unknown>
  const bboxNorm = fallback.bboxNorm as Record<string, unknown>
  const scroll = raw.scroll as Record<string, unknown>
  const motion = raw.motion as Record<string, unknown>
  const easing = motion.easing as Record<string, unknown>
  const fx = raw.fx as Record<string, unknown>

  let easingDef = { preset: "ease-in-out" as const }
  if (easing) {
    if ("preset" in easing && typeof easing.preset === "string") {
      easingDef = { preset: easing.preset as "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear" }
    }
  }

  let easingResult: ClickStep["motion"]["easing"] = easingDef
  if (easing && "cubicBezier" in easing && Array.isArray(easing.cubicBezier)) {
    easingResult = {
      cubicBezier: easing.cubicBezier.map((v: unknown) =>
        clamp(Number(v) || 0, -2, 2)
      ) as [number, number, number, number],
    }
  }

  let container = undefined
  if (scroll.container && typeof scroll.container === "object") {
    const sc = scroll.container as Record<string, unknown>
    container = {
      demoId: typeof sc.demoId === "string" ? sc.demoId : undefined,
      selector: typeof sc.selector === "string" ? sc.selector : undefined,
      scrollLeft: Number(sc.scrollLeft) || 0,
      scrollTop: Number(sc.scrollTop) || 0,
    }
  }

  return {
    id: raw.id as string,
    kind: "click",
    delayBeforeMs: clamp(Number(raw.delayBeforeMs) || 0, 0, 60000),
    stepSeed: typeof raw.stepSeed === "number" ? (raw.stepSeed >>> 0) : undefined,
    clickType: (["left", "right", "double"].includes(raw.clickType as string)
      ? raw.clickType
      : "left") as "left" | "right" | "double",
    target: {
      demoId: typeof target.demoId === "string" ? target.demoId : undefined,
      selector: typeof target.selector === "string" ? target.selector : undefined,
    },
    fallback: {
      xNorm: clamp(Number(fallback.xNorm) || 0, 0, 1),
      yNorm: clamp(Number(fallback.yNorm) || 0, 0, 1),
      bboxNorm: {
        left: clamp(Number(bboxNorm.left) || 0, 0, 1),
        top: clamp(Number(bboxNorm.top) || 0, 0, 1),
        width: clamp(Number(bboxNorm.width) || 0, 0, 1),
        height: clamp(Number(bboxNorm.height) || 0, 0, 1),
      },
      viewportWidth: Math.round(Number(fallback.viewportWidth) || 1440),
      viewportHeight: Math.round(Number(fallback.viewportHeight) || 900),
    },
    scroll: {
      winX: Number(scroll.winX) || 0,
      winY: Number(scroll.winY) || 0,
      container,
    },
    motion: {
      durationMs: clamp(Number(motion.durationMs) || 600, 50, 60000),
      easing: easingResult,
      pathStyle: motion.pathStyle === "direct" ? "direct" : "natural",
      jitterPx: clamp(Number(motion.jitterPx) || 0, 0, 50),
      overshootPx: clamp(Number(motion.overshootPx) || 0, 0, 100),
    },
    fx: {
      highlight: Boolean(fx.highlight),
      highlightMs: clamp(Number(fx.highlightMs) || 0, 0, 5000),
    },
  }
}

function clampPauseStep(raw: Record<string, unknown>): PauseStep {
  return {
    id: raw.id as string,
    kind: "pause",
    delayBeforeMs: clamp(Number(raw.delayBeforeMs) || 0, 0, 60000),
    stepSeed: typeof raw.stepSeed === "number" ? (raw.stepSeed >>> 0) : undefined,
    durationMs: clamp(Number(raw.durationMs) || 1000, 0, 60000),
    label: typeof raw.label === "string" ? raw.label.slice(0, 100) : undefined,
  }
}
