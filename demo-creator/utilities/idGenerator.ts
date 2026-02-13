import { nanoid } from "nanoid"

export function generateStepId(): string {
  return nanoid(8)
}

export function generateSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0
}
