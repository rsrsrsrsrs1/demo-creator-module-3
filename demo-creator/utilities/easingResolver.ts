import type { EasingDef } from "../types/script"

/**
 * Maps an EasingDef to a (t: number) => number function.
 * t is in [0, 1], output is in [0, 1].
 */

// Attempt cubic bezier solver using De Casteljau's subdivision
function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): (t: number) => number {
  // Sample the bezier curve and find y for a given x (time)
  // Using Newton's method for better precision
  const EPSILON = 1e-6

  function sampleCurveX(t: number): number {
    return ((1 - 3 * x2 + 3 * x1) * t + (3 * x2 - 6 * x1)) * t + 3 * x1 * t
  }

  function sampleCurveY(t: number): number {
    return ((1 - 3 * y2 + 3 * y1) * t + (3 * y2 - 6 * y1)) * t + 3 * y1 * t
  }

  function sampleCurveDerivativeX(t: number): number {
    return (3 * (1 - 3 * x2 + 3 * x1)) * t * t + (2 * (3 * x2 - 6 * x1)) * t + 3 * x1
  }

  function solveCurveX(x: number): number {
    // Newton's method
    let t = x
    for (let i = 0; i < 8; i++) {
      const xEst = sampleCurveX(t) - x
      if (Math.abs(xEst) < EPSILON) return t
      const d = sampleCurveDerivativeX(t)
      if (Math.abs(d) < EPSILON) break
      t -= xEst / d
    }

    // Fallback: bisection
    let lo = 0
    let hi = 1
    t = x
    while (lo < hi) {
      const xEst = sampleCurveX(t)
      if (Math.abs(xEst - x) < EPSILON) return t
      if (x > xEst) lo = t
      else hi = t
      t = (lo + hi) / 2
    }
    return t
  }

  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    return sampleCurveY(solveCurveX(x))
  }
}

const PRESET_MAP: Record<string, (t: number) => number> = {
  linear: (t) => t,
  ease: cubicBezier(0.25, 0.1, 0.25, 1.0),
  "ease-in": cubicBezier(0.42, 0, 1.0, 1.0),
  "ease-out": cubicBezier(0, 0, 0.58, 1.0),
  "ease-in-out": cubicBezier(0.42, 0, 0.58, 1.0),
}

export function resolveEasing(def: EasingDef): (t: number) => number {
  if ("preset" in def) {
    return PRESET_MAP[def.preset] ?? PRESET_MAP.ease
  }
  const [x1, y1, x2, y2] = def.cubicBezier
  return cubicBezier(x1, y1, x2, y2)
}
