"use client"

import { DemoCreator } from "@/demo-creator"
import { DemoContent } from "./demo-content"
import { useDemoStore } from "@/demo-creator/store"

export default function Page() {
  const uiResetKey = useDemoStore((s) => s.uiResetKey)
  
  return (
    <>
      <DemoCreator />
      <DemoContent key={uiResetKey} />
    </>
  )
}
