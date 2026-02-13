import type { BboxNorm } from "../types/script"

export function pixelToNorm(px: number, viewportSize: number): number {
  if (viewportSize === 0) return 0
  return px / viewportSize
}

export function normToPixel(norm: number, viewportSize: number): number {
  return norm * viewportSize
}

export function rectToNormBbox(
  rect: DOMRect,
  viewportWidth: number,
  viewportHeight: number
): BboxNorm {
  return {
    left: pixelToNorm(rect.left, viewportWidth),
    top: pixelToNorm(rect.top, viewportHeight),
    width: pixelToNorm(rect.width, viewportWidth),
    height: pixelToNorm(rect.height, viewportHeight),
  }
}

export function normBboxCenter(
  bbox: BboxNorm,
  viewportWidth: number,
  viewportHeight: number
): { x: number; y: number } {
  return {
    x: (bbox.left + bbox.width / 2) * viewportWidth,
    y: (bbox.top + bbox.height / 2) * viewportHeight,
  }
}
