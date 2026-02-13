"use client"

export function useFeatureFlag(): boolean {
  // In development, default to true. In production, read env var.
  const flag = process.env.NEXT_PUBLIC_DEMO_CREATOR
  if (flag === undefined) return true // default on in dev
  return flag === "true"
}
