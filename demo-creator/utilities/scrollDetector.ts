import type { ScrollContainer } from "../types/script"
import { selectorBuilder } from "./selectorBuilder"

/**
 * Walks up from the target element to find the nearest scrollable ancestor.
 * Returns scroll container info if found, undefined otherwise.
 */
export function detectScrollContainer(
  element: Element
): ScrollContainer | undefined {
  let current = element.parentElement

  while (current && current !== document.documentElement) {
    const style = getComputedStyle(current)
    const overflow = style.overflow + style.overflowX + style.overflowY

    if (overflow.includes("auto") || overflow.includes("scroll")) {
      if (
        current.scrollHeight > current.clientHeight ||
        current.scrollWidth > current.clientWidth
      ) {
        const result: ScrollContainer = {
          scrollLeft: current.scrollLeft,
          scrollTop: current.scrollTop,
        }

        const demoId = current.getAttribute("data-demo-id")
        if (demoId) {
          result.demoId = demoId
        }

        result.selector = selectorBuilder(current)
        return result
      }
    }

    current = current.parentElement
  }

  return undefined
}
