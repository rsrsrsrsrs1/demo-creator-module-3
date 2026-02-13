"use client"

import { useState, useRef, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useDemoStore } from "../store"
import { validateDemoScript } from "../utilities/schemaValidator"
import type { ValidationError } from "../types/editor"
import { Clipboard, FileUp, Check, AlertCircle } from "lucide-react"

type ImportExportModalProps = {
  mode: "import" | "export" | null
  onClose: () => void
}

export function ImportExportModal({ mode, onClose }: ImportExportModalProps) {
  if (mode === "export") {
    return <ExportModal onClose={onClose} />
  }
  if (mode === "import") {
    return <ImportModal onClose={onClose} />
  }
  return null
}

function ExportModal({ onClose }: { onClose: () => void }) {
  const script = useDemoStore((s) => s.script)
  const [copied, setCopied] = useState(false)

  const json = script ? JSON.stringify(script, null, 2) : ""

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const handleDownload = () => {
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `demo-script-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export Script</DialogTitle>
          <DialogDescription>
            Copy to clipboard or download as a JSON file.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <textarea
            readOnly
            value={json}
            className="h-64 w-full rounded-md border border-input bg-muted/30 p-3 text-xs font-mono resize-none focus:outline-none"
            aria-label="Exported JSON"
          />

          <div className="flex gap-2">
            <Button onClick={handleCopy} variant="outline" className="flex-1">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Clipboard className="h-4 w-4" />
                  Copy to Clipboard
                </>
              )}
            </Button>
            <Button onClick={handleDownload} className="flex-1">
              <FileUp className="h-4 w-4" />
              Download JSON
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ImportModal({ onClose }: { onClose: () => void }) {
  const loadScript = useDemoStore((s) => s.loadScript)
  const [tab, setTab] = useState<"paste" | "upload">("paste")
  const [pasteValue, setPasteValue] = useState("")
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processJson = useCallback(
    (raw: string) => {
      setErrors([])
      setSuccess(false)

      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        setErrors([{ path: "", message: "Invalid JSON syntax" }])
        return
      }

      const result = validateDemoScript(parsed)
      if (!result.ok) {
        setErrors(result.errors)
        return
      }

      loadScript(result.script)
      setSuccess(true)
      setTimeout(onClose, 800)
    },
    [loadScript, onClose]
  )

  const handlePasteSubmit = () => {
    processJson(pasteValue)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        processJson(reader.result)
      }
    }
    reader.readAsText(file)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Script</DialogTitle>
          <DialogDescription>
            Paste JSON or upload a .json file.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {/* Tab toggles */}
          <div className="flex gap-1 rounded-md border border-input p-0.5">
            <button
              className={`flex-1 rounded px-3 py-1 text-xs transition-colors ${
                tab === "paste"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              onClick={() => setTab("paste")}
            >
              Paste JSON
            </button>
            <button
              className={`flex-1 rounded px-3 py-1 text-xs transition-colors ${
                tab === "upload"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              onClick={() => setTab("upload")}
            >
              Upload File
            </button>
          </div>

          {tab === "paste" ? (
            <>
              <textarea
                value={pasteValue}
                onChange={(e) => setPasteValue(e.target.value)}
                placeholder="Paste your DemoScript JSON here..."
                className="h-48 w-full rounded-md border border-input bg-background p-3 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label="JSON input"
              />
              <Button onClick={handlePasteSubmit} disabled={!pasteValue.trim()}>
                Import
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="h-4 w-4" />
                Choose .json file
              </Button>
            </div>
          )}

          {/* Validation errors */}
          {errors.length > 0 && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                <p className="text-xs font-medium text-destructive">
                  Validation errors
                </p>
              </div>
              <ul className="flex flex-col gap-0.5">
                {errors.map((err, i) => (
                  <li key={i} className="text-xs text-destructive/80">
                    {err.path ? `${err.path}: ` : ""}
                    {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-1.5 text-xs text-green-600">
              <Check className="h-3.5 w-3.5" />
              Script imported successfully
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
