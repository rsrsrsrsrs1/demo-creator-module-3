"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Toolbar } from "./Toolbar"
import { Timeline } from "./Timeline"
import { StepInspector } from "./StepInspector"
import { ReplayOverlay } from "./ReplayOverlay"
import { ImportExportModal } from "./ImportExportModal"
import { useRecorder } from "../hooks/useRecorder"
import { useKeyboard } from "../hooks/useKeyboard"
import { useDemoStore } from "../store"
import { replayControlsRef } from "./ReplayOverlay"
import type { ModalView } from "../types/editor"

export function DemoCreatorRoot() {
  const [modalView, setModalView] = useState<ModalView>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const { setRootElement } = useRecorder()

  const replayState = useDemoStore((s) => s.replayState)
  const selectedStepId = useDemoStore((s) => s.selectedStepId)
  const selectStep = useDemoStore((s) => s.selectStep)
  const removeStep = useDemoStore((s) => s.removeStep)
  const script = useDemoStore((s) => s.script)

  // Register root element for click filtering
  useEffect(() => {
    setRootElement(rootRef.current)
  }, [setRootElement])

  // Keyboard shortcuts
  const handlePlayPause = useCallback(() => {
    if (replayState === "playing") {
      replayControlsRef.current?.pause()
    } else {
      replayControlsRef.current?.play()
    }
  }, [replayState])

  const handleDelete = useCallback(() => {
    if (selectedStepId) {
      removeStep(selectedStepId)
    }
  }, [selectedStepId, removeStep])

  const handleEscape = useCallback(() => {
    if (modalView) {
      setModalView(null)
    } else {
      selectStep(null)
    }
  }, [modalView, selectStep])

  useKeyboard({
    onPlayPause: handlePlayPause,
    onStepForward: () => replayControlsRef.current?.stepForward(),
    onStepBackward: () => replayControlsRef.current?.stepBackward(),
    onDelete: handleDelete,
    onEscape: handleEscape,
  })

  return (
    <>
      {/* The editor chrome */}
      <div
        ref={rootRef}
        data-demo-creator-root=""
        className="fixed inset-y-0 left-0 z-50 flex flex-col bg-background border-r border-border shadow-lg"
        style={{ width: 320 }}
      >
        {/* Toolbar at top */}
        <Toolbar
          onOpenImport={() => setModalView("import")}
          onOpenExport={() => setModalView("export")}
        />

        {/* Timeline + Inspector in scrollable area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Timeline */}
          <div className="flex-1 overflow-y-auto border-b border-border min-h-0">
            <Timeline />
          </div>

          {/* Inspector */}
          <div className="h-[45%] overflow-y-auto min-h-0">
            <StepInspector />
          </div>
        </div>
      </div>

      {/* Replay overlay (renders above everything) */}
      <ReplayOverlay />

      {/* Import/Export modal */}
      <ImportExportModal mode={modalView} onClose={() => setModalView(null)} />
    </>
  )
}
