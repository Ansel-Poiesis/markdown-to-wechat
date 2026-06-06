/**
 * Image paste & drag-drop handler for the Markdown editor.
 * Converts pasted/dropped images to base64 data URLs and inserts Markdown image syntax.
 * Optionally compresses images to reduce size.
 */

export interface ImageInsertOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'image/png' | 'image/jpeg' | 'image/webp'
}

const DEFAULT_OPTIONS: Required<ImageInsertOptions> = {
  maxWidth: 1200,
  maxHeight: 2400,
  quality: 0.85,
  format: 'image/jpeg',
}

function compressImage(
  file: File,
  options: Required<ImageInsertOptions>,
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img

      // Scale down if too large
      if (width > options.maxWidth) {
        height = Math.round((height * options.maxWidth) / width)
        width = options.maxWidth
      }
      if (height > options.maxHeight) {
        width = Math.round((width * options.maxHeight) / height)
        height = options.maxHeight
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)

      const dataUrl = canvas.toDataURL(options.format, options.quality)
      resolve({ dataUrl, width, height })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function processImageFile(
  file: File,
  options: ImageInsertOptions = {},
): Promise<{ markdown: string; originalSize: number; compressedSize: number }> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const originalSize = file.size

  // Only compress if the image is large or not already a small format
  const shouldCompress = file.size > 200 * 1024 || file.type === 'image/png'

  let dataUrl: string
  let compressedSize: number

  if (shouldCompress) {
    const result = await compressImage(file, opts)
    dataUrl = result.dataUrl
    compressedSize = Math.round((dataUrl.length * 3) / 4) // approximate base64 size
  } else {
    dataUrl = await fileToDataUrl(file)
    compressedSize = originalSize
  }

  const alt = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ')
  const markdown = `![${alt}](${dataUrl})`

  return { markdown, originalSize, compressedSize }
}

export function getImageFilesFromClipboard(event: ClipboardEvent): File[] {
  const files: File[] = []
  const items = event.clipboardData?.items
  if (!items) return files

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) files.push(file)
    }
  }
  return files
}

export function getImageFilesFromDragDrop(event: DragEvent): File[] {
  const files: File[] = []
  const items = event.dataTransfer?.items
  if (!items) return files

  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) files.push(file)
    }
  }
  return files
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Creates a CodeMirror extension that handles image paste and drop events.
 */
export function createImageHandler(
  onInsert: (markdown: string, stats: { originalSize: number; compressedSize: number }) => void,
) {
  return [
    {
      // This will be used as a DOM event handler on the editor
      handlePaste: async (event: ClipboardEvent) => {
        const files = getImageFilesFromClipboard(event)
        if (files.length === 0) return false

        event.preventDefault()
        for (const file of files) {
          const result = await processImageFile(file)
          onInsert(result.markdown, { originalSize: result.originalSize, compressedSize: result.compressedSize })
        }
        return true
      },
      handleDrop: async (event: DragEvent) => {
        const files = getImageFilesFromDragDrop(event)
        if (files.length === 0) return false

        event.preventDefault()
        for (const file of files) {
          const result = await processImageFile(file)
          onInsert(result.markdown, { originalSize: result.originalSize, compressedSize: result.compressedSize })
        }
        return true
      },
    },
  ]
}
