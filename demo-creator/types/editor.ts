export type DragState = {
  isDragging: boolean
  dragIndex: number | null
  dropIndex: number | null
}

export type ModalView = "import" | "export" | null

export type ImportTab = "paste" | "upload"

export type ValidationError = {
  path: string
  message: string
}
