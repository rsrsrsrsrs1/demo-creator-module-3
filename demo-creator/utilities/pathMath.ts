import type { StepMotion } from "../types/script"
import { PRNG } from "./prng"
import { resolveEasing } from "./easingResolver"

export type Point = { x: number; y: number }

/**
 * Evaluate a cubic Bezier at parameter t.
 */
function cubicBezierPoint(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): Point {
  const u = 1 - t
  const uu = u * u
  const uuu = uu * u
  const tt = t * t
  const ttt = tt * t
  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  }
}

/**
 * Compute the tangent of a cubic Bezier at parameter t.
 */
function cubicBezierTangent(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): Point {
  const u = 1 - t
  return {
    x:
      3 * u * u * (p1.x - p0.x) +
      6 * u * t * (p2.x - p1.x) +
      3 * t * t * (p3.x - p2.x),
    y:
      3 * u * u * (p1.y - p0.y) +
      6 * u * t * (p2.y - p1.y) +
      3 * t * t * (p3.y - p2.y),
  }
}

function perpendicular(v: Point): Point {
  return { x: -v.y, y: v.x }
}

function normalize(v: Point): Point {
  const len = Math.sqrt(v.x * v.x + v.y * v.y)
  if (len === 0) return { x: 0, y: 0 }
  return { x: v.x / len, y: v.y / len }
}

/**
 * Generate correlated noise sequence.
 * N[0] = rng.float(-1, 1)
 * N[i] = N[i-1] * 0.7 + rng.float(-1, 1) * 0.3
 */
function generateCorrelatedNoise(rng: PRNG, count: number): number[] {
  const noise: number[] = new Array(count)
  noise[0] = rng.float(-1, 1)
  for (let i = 1; i < count; i++) {
    noise[i] = noise[i - 1] * 0.7 + rng.float(-1, 1) * 0.3
  }
  return noise
}

export type PathSampler = (tLinear: number) => Point

/**
 * Create a path sampler given start, end, motion params, and a seeded PRNG.
 * Returns a function that takes linear t in [0, 1] and returns screen-space {x, y}.
 */
export function createPathSampler(
  start: Point,
  end: Point,
  motion: StepMotion,
  rng: PRNG,
  reducedMotion: boolean = false
): PathSampler {
  const effectiveJitter = reducedMotion ? 0 : motion.jitterPx
  const effectiveOvershoot = reducedMotion ? 0 : motion.overshootPx
  const effectivePathStyle = reducedMotion ? "direct" : motion.pathStyle

  // Displacement vector and perpendicular
  const dx = end.x - start.x
  const dy = end.y - start.y
  const dPerp = { x: -dy, y: dx }

  // Control points
  let p1: Point
  let p2: Point

  if (effectivePathStyle === "natural") {
    const off1 = rng.float(-0.15, 0.15)
    const off2 = rng.float(-0.15, 0.15)
    p1 = {
      x: start.x + 0.33 * dx + off1 * dPerp.x,
      y: start.y + 0.33 * dy + off1 * dPerp.y,
    }
    p2 = {
      x: start.x + 0.66 * dx + off2 * dPerp.x,
      y: start.y + 0.66 * dy + off2 * dPerp.y,
    }
  } else {
    // Direct: no perpendicular offset
    p1 = {
      x: start.x + 0.5 * dx,
      y: start.y + 0.5 * dy,
    }
    p2 = { ...p1 }
  }

  const easingFn = resolveEasing(motion.easing)

  // Pre-generate noise for jitter (sample at ~60fps equivalent granularity)
  const noiseSamples = 120
  const noise = generateCorrelatedNoise(rng, noiseSamples)

  // Overshoot: extend past the endpoint
  // The overshoot takes up 15% of the total t range (0.85 to 1.0)
  const hasOvershoot = effectiveOvershoot > 0 && effectivePathStyle === "natural"
  const mainTEnd = hasOvershoot ? 0.85 : 1.0

  // Pre-compute the overshoot point
  const approachDir = normalize({ x: dx, y: dy })
  const overshootPoint: Point = hasOvershoot
    ? {
        x: end.x + approachDir.x * effectiveOvershoot,
        y: end.y + approachDir.y * effectiveOvershoot,
      }
    : end

  return (tLinear: number) => {
    if (tLinear <= 0) return { ...start }
    if (tLinear >= 1) return { ...end }

    let pos: Point

    if (hasOvershoot && tLinear > mainTEnd) {
      // Overshoot return arc: from overshoot point back to end
      const arcT = (tLinear - mainTEnd) / (1 - mainTEnd)
      const easedArcT = arcT * arcT // quadratic ease-in for snap-back
      pos = {
        x: overshootPoint.x + (end.x - overshootPoint.x) * easedArcT,
        y: overshootPoint.y + (end.y - overshootPoint.y) * easedArcT,
      }
    } else {
      // Main curve
      const normalizedT = tLinear / mainTEnd
      const tEased = easingFn(Math.min(normalizedT, 1))

      if (hasOvershoot) {
        // Curve goes from start to overshoot point
        const ovP2: Point = {
          x: start.x + 0.66 * (overshootPoint.x - start.x) + (p2.x - start.x - 0.66 * dx),
          y: start.y + 0.66 * (overshootPoint.y - start.y) + (p2.y - start.y - 0.66 * dy),
        }
        pos = cubicBezierPoint(start, p1, ovP2, overshootPoint, tEased)
      } else {
        pos = cubicBezierPoint(start, p1, p2, end, tEased)
      }
    }

    // Apply jitter
    if (effectiveJitter > 0) {
      const noiseIdx = Math.min(
        Math.floor(tLinear * (noiseSamples - 1)),
        noiseSamples - 1
      )
      const noiseVal = noise[noiseIdx]

      // Get tangent for perpendicular jitter direction
      const tForTangent = Math.min(tLinear / mainTEnd, 0.999)
      const tangent = cubicBezierTangent(start, p1, p2, end, tForTangent)
      const perp = normalize(perpendicular(tangent))

      const jitterScale =
        effectivePathStyle === "direct" ? effectiveJitter * 0.25 : effectiveJitter

      pos = {
        x: pos.x + perp.x * noiseVal * jitterScale,
        y: pos.y + perp.y * noiseVal * jitterScale,
      }
    }

    return pos
  }
}
