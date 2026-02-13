"use client"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useDemoStore } from "../store"
import { useRecorder } from "../hooks/useRecorder"
import { replayControlsRef } from "./ReplayOverlay"
import {
  Circle,
  Square,
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Download,
  Upload,
} from "lucide-react"

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4]

type ToolbarProps = {
  onOpenImport: () => void
  onOpenExport: () => void
}

export function Toolbar({ onOpenImport, onOpenExport }: ToolbarProps) {
  const replayState = useDemoStore((s) => s.replayState)
  const replaySpeed = useDemoStore((s) => s.replaySpeed)
  const setSpeed = useDemoStore((s) => s.setSpeed)
  const safeMode = useDemoStore((s) => s.safeMode)
  const setSafeMode = useDemoStore((s) => s.setSafeMode)
  const script = useDemoStore((s) => s.script)
  const loadScript = useDemoStore((s) => s.loadScript)

  const { recorderState, startRecording, stopRecording } = useRecorder()

  const isRecording = recorderState === "recording"
  const isPlaying = replayState === "playing"
  const isPaused = replayState === "paused"
  const hasScript = !!script

  const handlePlay = () => {
    if (isPlaying) {
      replayControlsRef.current?.pause()
    } else {
      replayControlsRef.current?.play()
    }
  }

  const handleRestart = () => replayControlsRef.current?.restart()
  const handleStepBack = () => replayControlsRef.current?.stepBackward()
  const handleStepForward = () => replayControlsRef.current?.stepForward()

  const handleSeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!script) return
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val)) {
      loadScript({ ...script, seed: val >>> 0 })
    }
  }

  return (
    <div className="flex items-center gap-1 border-b border-border bg-card px-3 py-2 flex-wrap">
      {/* Record / Stop */}
      <div className="flex items-center gap-1">
        <Button
          variant={isRecording ? "destructive" : "outline"}
          size="sm"
          onClick={isRecording ? stopRecording : startRecording}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
          disabled={isPlaying}
        >
          {isRecording ? (
            <>
              <Square className="h-3.5 w-3.5" />
              <span className="sr-only md:not-sr-only">Stop</span>
            </>
          ) : (
            <>
              <Circle className="h-3.5 w-3.5 fill-current text-destructive" />
              <span className="sr-only md:not-sr-only">Record</span>
            </>
          )}
        </Button>
      </div>

      <div className="mx-1 h-6 w-px bg-border" />

      {/* Playback controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleStepBack}
          disabled={!hasScript || isRecording}
          aria-label="Previous step"
        >
          <SkipBack className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant={isPlaying ? "secondary" : "outline"}
          size="icon"
          className="h-8 w-8"
          onClick={handlePlay}
          disabled={!hasScript || isRecording}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleStepForward}
          disabled={!hasScript || isRecording}
          aria-label="Next step"
        >
          <SkipForward className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleRestart}
          disabled={!hasScript || isRecording}
          aria-label="Restart"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="mx-1 h-6 w-px bg-border" />

      {/* Speed selector */}
      <div className="flex items-center gap-1.5">
        <Label htmlFor="speed-select" className="text-xs text-muted-foreground whitespace-nowrap">
          Speed
        </Label>
        <select
          id="speed-select"
          value={replaySpeed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Playback speed"
        >
          {SPEED_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}x
            </option>
          ))}
        </select>
      </div>

      {/* Seed input */}
      <div className="flex items-center gap-1.5">
        <Label htmlFor="seed-input" className="text-xs text-muted-foreground whitespace-nowrap">
          Seed
        </Label>
        <Input
          id="seed-input"
          type="number"
          value={script?.seed ?? ""}
          onChange={handleSeedChange}
          disabled={!hasScript}
          className="h-8 w-28 text-xs"
          aria-label="Random seed"
        />
      </div>

      <div className="flex-1" />

      {/* Export / Import */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenExport}
          disabled={!hasScript}
          aria-label="Export script"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="sr-only md:not-sr-only">Export</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenImport}
          aria-label="Import script"
        >
          <Upload className="h-3.5 w-3.5" />
          <span className="sr-only md:not-sr-only">Import</span>
        </Button>
      </div>

      <div className="mx-1 h-6 w-px bg-border" />

      {/* Safe Mode */}
      <div className="flex items-center gap-1.5">
        <Label htmlFor="safe-mode" className="text-xs text-muted-foreground whitespace-nowrap">
          Safe Mode
        </Label>
        <Switch
          id="safe-mode"
          checked={safeMode}
          onCheckedChange={setSafeMode}
          aria-label="Toggle safe mode for synthetic clicks"
        />
      </div>
    </div>
  )
}
