"use client"

import dynamic from "next/dynamic"

export const DemoCreator = dynamic(
  () =>
    import("./components/DemoCreatorRoot").then((mod) => ({
      default: mod.DemoCreatorRoot,
    })),
  { ssr: false }
)
