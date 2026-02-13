"use client"

import { useCallback } from "react"
import type { StepMotion } from "../types/script"
import { PRNG } from "../utilities/prng"
import { createPathSampler, type PathSampler, type Point } from "../utilities/pathMath"

export function usePathGenerator() {
  const generate = useCallback(
    (
      start: Point,
      end: Point,
      motion: StepMotion,
      rng: PRNG,
      reducedMotion: boolean = false
    ): PathSampler => {
      return createPathSampler(start, end, motion, rng, reducedMotion)
    },
    []
  )

  return { generatePath: generate }
}
