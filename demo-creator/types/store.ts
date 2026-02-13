import type { DemoScript, DemoStep } from "./script"

export type RecorderState = "idle" | "recording"
export type ReplayState = "stopped" | "playing" | "paused"

export type DemoStoreState = {
  script: DemoScript | null
  selectedStepId: string | null
  recorderState: RecorderState
  replayState: ReplayState
  replaySpeed: number
  safeMode: boolean
  undoStack: (DemoScript | null)[]
  redoStack: (DemoScript | null)[]
}

export type DemoStoreActions = {
  addStep: (step: DemoStep, index?: number) => void
  removeStep: (id: string) => void
  reorderStep: (fromIndex: number, toIndex: number) => void
  updateStep: (id: string, patch: Partial<DemoStep>) => void
  loadScript: (script: DemoScript) => void
  clearScript: () => void
  selectStep: (id: string | null) => void
  setRecorderState: (state: RecorderState) => void
  setReplayState: (state: ReplayState) => void
  setSpeed: (speed: number) => void
  setSafeMode: (on: boolean) => void
  undo: () => void
  redo: () => void
}

export type DemoStore = DemoStoreState & DemoStoreActions
