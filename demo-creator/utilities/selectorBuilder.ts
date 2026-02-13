/**
 * Generates a minimal unique CSS selector from a DOM element.
 * Priority: #id > [data-demo-id] > .class:nth-of-type(n) > tag path
 * Verifies uniqueness via querySelectorAll and adds qualifiers as needed.
 */

function escapeCSSSelector(str: string): string {
  return str.replace(/([.:#\[\](),>+~\\])/g, "\\$1")
}

export function selectorBuilder(element: Element): string {
  // 1. Try id
  if (element.id) {
    const sel = `#${escapeCSSSelector(element.id)}`
    try {
      if (document.querySelectorAll(sel).length === 1) return sel
    } catch {
      // invalid selector, continue
    }
  }

  // 2. Try data-demo-id
  const demoId = element.getAttribute("data-demo-id")
  if (demoId) {
    const sel = `[data-demo-id="${escapeCSSSelector(demoId)}"]`
    try {
      if (document.querySelectorAll(sel).length === 1) return sel
    } catch {
      // continue
    }
  }

  // 3. Build a path from the element up to the body
  const parts: string[] = []
  let current: Element | null = element

  while (current && current !== document.documentElement && current !== document.body) {
    let part = current.tagName.toLowerCase()

    // Try adding classes
    if (current.classList.length > 0) {
      const classes = Array.from(current.classList)
        .filter((c) => !c.startsWith("__") && c.length < 50) // skip generated hashes
        .slice(0, 2)
        .map((c) => `.${escapeCSSSelector(c)}`)
        .join("")
      if (classes) {
        part += classes
      }
    }

    // Add nth-of-type if needed
    const parent = current.parentElement
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (s) => s.tagName === current!.tagName
      )
      if (siblings.length > 1) {
        const idx = siblings.indexOf(current) + 1
        part += `:nth-of-type(${idx})`
      }
    }

    parts.unshift(part)

    // Check if the current path is unique
    const sel = parts.join(" > ")
    try {
      if (document.querySelectorAll(sel).length === 1) return sel
    } catch {
      // continue building
    }

    current = current.parentElement
  }

  // Final fallback: full path from body
  const finalSel = parts.join(" > ")
  return finalSel
}
