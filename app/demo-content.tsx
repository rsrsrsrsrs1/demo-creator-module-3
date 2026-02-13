"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function DemoContent() {
  const [activeTab, setActiveTab] = useState("overview")
  const [count, setCount] = useState(0)
  const [formSubmitted, setFormSubmitted] = useState(false)

  return (
    <div className="ml-[320px] min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-8 py-4">
        <nav className="flex items-center gap-6">
          <span
            data-demo-id="nav-logo"
            className="text-lg font-semibold text-foreground cursor-pointer"
          >
            DemoApp
          </span>
          <button
            data-demo-id="nav-home"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setActiveTab("overview")}
          >
            Home
          </button>
          <button
            data-demo-id="nav-features"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setActiveTab("features")}
          >
            Features
          </button>
          <button
            data-demo-id="nav-contact"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setActiveTab("contact")}
          >
            Contact
          </button>
        </nav>
      </header>

      {/* Main content area */}
      <main className="px-8 py-10" data-demo-safe-root="">
        {activeTab === "overview" && (
          <div className="flex flex-col gap-8 max-w-2xl">
            <div>
              <h1 className="text-3xl font-bold text-foreground text-balance">
                Welcome to DemoApp
              </h1>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                This is sample content for testing the Demo Creator. Click Record
                in the left panel, then click around this page to capture anchor
                points. Stop recording, then Play to see the synthesized cursor.
              </p>
            </div>

            {/* Counter */}
            <div className="flex items-center gap-4 p-6 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground">Counter:</p>
              <span
                data-demo-id="counter-value"
                className="text-2xl font-mono font-bold text-foreground tabular-nums"
              >
                {count}
              </span>
              <Button
                data-demo-id="counter-increment"
                variant="outline"
                size="sm"
                onClick={() => setCount((c) => c + 1)}
              >
                Increment
              </Button>
              <Button
                data-demo-id="counter-reset"
                variant="secondary"
                size="sm"
                onClick={() => setCount(0)}
              >
                Reset
              </Button>
            </div>

            {/* CTA button */}
            <Button
              data-demo-id="cta-primary"
              className="w-fit"
              size="lg"
              onClick={() => setActiveTab("features")}
            >
              Explore Features
            </Button>
          </div>
        )}

        {activeTab === "features" && (
          <div className="flex flex-col gap-6 max-w-2xl">
            <h2 className="text-2xl font-bold text-foreground">Features</h2>

            <div className="grid grid-cols-2 gap-4">
              {[
                { id: "feature-record", title: "Record", desc: "Capture click anchors with one button." },
                { id: "feature-replay", title: "Replay", desc: "Watch synthesized cursor motion." },
                { id: "feature-edit", title: "Edit", desc: "Fine-tune timing and easing per step." },
                { id: "feature-export", title: "Export", desc: "Save and share as portable JSON." },
              ].map((f) => (
                <div
                  key={f.id}
                  data-demo-id={f.id}
                  className="rounded-lg border border-border bg-card p-4 cursor-pointer hover:border-foreground/20 transition-colors"
                >
                  <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Scrollable list */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Scrollable Task List</h3>
              <div
                data-demo-id="task-scroll-area"
                className="h-48 overflow-y-auto rounded-lg border border-border bg-card"
              >
                {Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={i}
                    data-demo-id={`task-item-${i}`}
                    className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                    <span className="text-sm text-foreground">Task item {i + 1}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {(i + 1) * 5} min
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setActiveTab("overview")}
            >
              Back to Overview
            </Button>
          </div>
        )}

        {activeTab === "contact" && (
          <div className="flex flex-col gap-6 max-w-md">
            <h2 className="text-2xl font-bold text-foreground">Contact</h2>

            {formSubmitted ? (
              <div
                data-demo-id="form-success"
                className="rounded-lg border border-border bg-card p-6 text-center"
              >
                <p className="text-sm text-foreground font-medium">
                  Thank you for your message.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setFormSubmitted(true)
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contact-name">Name</Label>
                  <Input
                    id="contact-name"
                    data-demo-id="contact-name"
                    placeholder="Your name"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    data-demo-id="contact-email"
                    type="email"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contact-message">Message</Label>
                  <textarea
                    id="contact-message"
                    data-demo-id="contact-message"
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px]"
                    placeholder="Your message..."
                  />
                </div>
                <Button
                  type="submit"
                  data-demo-id="contact-submit"
                >
                  Send Message
                </Button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
