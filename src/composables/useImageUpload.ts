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

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const SUPPORTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

function compressImage(
  file: File,
  options: Required<ImageInsertOptions>,
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      try {
        let { width, height } = img
        if (!width || !height || width * height > 40_000_000) {
          throw new Error('图片尺寸无效或超过 4000 万像素，请先缩小图片。')
        }

        // Scale down if too large
        if (width > options.maxWidth) {
          height = Math.max(1, Math.round((height * options.maxWidth) / width))
          width = options.maxWidth
        }
        if (height > options.maxHeight) {
          width = Math.max(1, Math.round((width * options.maxHeight) / height))
          height = options.maxHeight
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('浏览器无法处理图片，请尝试其他浏览器。'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)

        const dataUrl = canvas.toDataURL(options.format, options.quality)
        if (!dataUrl.startsWith('data:image/')) throw new Error('图片压缩失败，请先缩小图片。')
        resolve({ dataUrl, width, height })
      } catch (error) {
        reject(error)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('无法读取图片，请检查文件是否损坏。'))
    }
    img.src = url
  })
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('无法读取图片文件。'))
    reader.onabort = () => reject(new Error('图片读取已取消。'))
    reader.readAsDataURL(file)
  })
}

export async function processImageFile(
  file: File,
  options: ImageInsertOptions = {},
): Promise<{ markdown: string; originalSize: number; compressedSize: number }> {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    throw new Error('暂仅支持 PNG、JPEG、WebP 和 GIF 图片。')
  }
  if (file.size > MAX_IMAGE_BYTES) throw new Error('图片超过 10 MB，请先压缩后再插入。')
  const opts = {
    ...DEFAULT_OPTIONS,
    // Preserve transparency by default; GIF is kept unchanged to preserve animation.
    format:
      file.type === 'image/png' || file.type === 'image/webp' ? file.type : DEFAULT_OPTIONS.format,
    ...options,
  } satisfies Required<ImageInsertOptions>
  if (
    !Number.isInteger(opts.maxWidth) ||
    opts.maxWidth < 1 ||
    !Number.isInteger(opts.maxHeight) ||
    opts.maxHeight < 1 ||
    !Number.isFinite(opts.quality) ||
    opts.quality < 0 ||
    opts.quality > 1
  )
    throw new Error('图片压缩参数无效。')
  const originalSize = file.size

  // Only compress if the image is large or not already a small format
  const shouldCompress =
    file.type !== 'image/gif' && (file.size > 200 * 1024 || file.type === 'image/png')

  let dataUrl: string
  let compressedSize: number

  if (shouldCompress) {
    const result = await compressImage(file, opts)
    dataUrl = result.dataUrl
    const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
    compressedSize =
      Math.floor((base64.length * 3) / 4) -
      (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0)
  } else {
    dataUrl = await fileToDataUrl(file)
    compressedSize = originalSize
  }

  const alt = file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]/g, ' ')
    .replace(/[[\]\\\r\n]/g, ' ')
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
          onInsert(result.markdown, {
            originalSize: result.originalSize,
            compressedSize: result.compressedSize,
          })
        }
        return true
      },
      handleDrop: async (event: DragEvent) => {
        const files = getImageFilesFromDragDrop(event)
        if (files.length === 0) return false

        event.preventDefault()
        for (const file of files) {
          const result = await processImageFile(file)
          onInsert(result.markdown, {
            originalSize: result.originalSize,
            compressedSize: result.compressedSize,
          })
        }
        return true
      },
    },
  ]
}
