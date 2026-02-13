import { create } from "zustand"
import type { DemoStore } from "./types/store"
import type { DemoScript, DemoStep } from "./types/script"

const MAX_UNDO = 50

function deepClone<T>(obj: T): T {
  if (obj === null) return obj
  return JSON.parse(JSON.stringify(obj))
}

export const useDemoStore = create<DemoStore>((set, get) => ({
  // State
  script: null,
  selectedStepId: null,
  recorderState: "idle",
  replayState: "stopped",
  replaySpeed: 1,
  safeMode: false,
  undoStack: [],
  redoStack: [],
  uiResetKey: 0,

  // --- Internal: push current script to undo stack ---
  // (not exposed directly; called before mutations)

  // Script mutations
  addStep: (step: DemoStep, index?: number) => {
    const { script, undoStack } = get()
    if (!script) return
    const snapshot = deepClone(script)
    const newSteps = [...script.steps]
    if (index !== undefined && index >= 0 && index <= newSteps.length) {
      newSteps.splice(index, 0, step)
    } else {
      newSteps.push(step)
    }
    set({
      script: { ...script, steps: newSteps },
      undoStack: [...undoStack.slice(-(MAX_UNDO - 1)), snapshot],
      redoStack: [],
    })
  },

  removeStep: (id: string) => {
    const { script, undoStack, selectedStepId } = get()
    if (!script) return
    const snapshot = deepClone(script)
    const newSteps = script.steps.filter((s) => s.id !== id)
    set({
      script: { ...script, steps: newSteps },
      selectedStepId: selectedStepId === id ? null : selectedStepId,
      undoStack: [...undoStack.slice(-(MAX_UNDO - 1)), snapshot],
      redoStack: [],
    })
  },

  reorderStep: (fromIndex: number, toIndex: number) => {
    const { script, undoStack } = get()
    if (!script) return
    if (fromIndex === toIndex) return
    const snapshot = deepClone(script)
    const newSteps = [...script.steps]
    const [moved] = newSteps.splice(fromIndex, 1)
    newSteps.splice(toIndex, 0, moved)
    set({
      script: { ...script, steps: newSteps },
      undoStack: [...undoStack.slice(-(MAX_UNDO - 1)), snapshot],
      redoStack: [],
    })
  },

  updateStep: (id: string, patch: Partial<DemoStep>) => {
    const { script, undoStack } = get()
    if (!script) return
    const snapshot = deepClone(script)
    const newSteps = script.steps.map((s) => {
      if (s.id !== id) return s
      return { ...s, ...patch } as DemoStep
    })
    set({
      script: { ...script, steps: newSteps },
      undoStack: [...undoStack.slice(-(MAX_UNDO - 1)), snapshot],
      redoStack: [],
    })
  },

  loadScript: (script: DemoScript) => {
    set({
      script: deepClone(script),
      selectedStepId: null,
      recorderState: "idle",
      replayState: "stopped",
      undoStack: [],
      redoStack: [],
    })
  },

  clearScript: () => {
    const { script, undoStack } = get()
    const snapshot = script ? deepClone(script) : null
    set({
      script: null,
      selectedStepId: null,
      recorderState: "idle",
      replayState: "stopped",
      undoStack: snapshot
        ? [...undoStack.slice(-(MAX_UNDO - 1)), snapshot]
        : undoStack,
      redoStack: [],
    })
  },

  // Selection
  selectStep: (id: string | null) => set({ selectedStepId: id }),

  // Recorder
  setRecorderState: (state) => set({ recorderState: state }),

  // Replay
  setReplayState: (state) => set({ replayState: state }),
  setSpeed: (speed) => set({ replaySpeed: speed }),
  resetUI: () => set((state) => ({ uiResetKey: state.uiResetKey + 1 })),

  // Safe mode
  setSafeMode: (on) => set({ safeMode: on }),

  // Undo/Redo
  undo: () => {
    const { undoStack, script } = get()
    if (undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]
    const newUndoStack = undoStack.slice(0, -1)
    set({
      script: prev ? deepClone(prev) : null,
      undoStack: newUndoStack,
      redoStack: [
        ...(get().redoStack.length < MAX_UNDO
          ? get().redoStack
          : get().redoStack.slice(1)),
        script ? deepClone(script) : null,
      ],
    })
  },

  redo: () => {
    const { redoStack, script } = get()
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]
    const newRedoStack = redoStack.slice(0, -1)
    set({
      script: next ? deepClone(next) : null,
      redoStack: newRedoStack,
      undoStack: [
        ...(get().undoStack.length < MAX_UNDO
          ? get().undoStack
          : get().undoStack.slice(1)),
        script ? deepClone(script) : null,
      ],
    })
  },
}))
