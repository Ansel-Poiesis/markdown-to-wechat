import { afterEach, describe, expect, it, vi } from 'vitest'
import { processImageFile } from '@/composables/useImageUpload'

function stubImageBrowser(width = 400, height = 300) {
  vi.stubGlobal(
    'Image',
    class {
      width = width
      height = height
      onload = () => {}
      set src(_value: string) {
        queueMicrotask(() => this.onload())
      }
    },
  )
  const encode = vi.fn((format: string) => `data:${format};base64,YQ==`)
  vi.stubGlobal('document', {
    createElement: () => ({ getContext: () => ({ drawImage: vi.fn() }), toDataURL: encode }),
  })
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  return encode
}

describe('image ingestion failure and format boundaries', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('keeps PNG encoding for transparent images and sanitizes Markdown delimiters in filenames', async () => {
    const encode = stubImageBrowser()
    const result = await processImageFile(new File(['png'], 'a]b[c.png', { type: 'image/png' }))
    expect(encode).toHaveBeenCalledWith('image/png', 0.85)
    expect(result.markdown).toBe('![a b c](data:image/png;base64,YQ==)')
    expect(result.compressedSize).toBe(1)
  })

  it('rejects canvas encoding failures instead of leaving image processing pending', async () => {
    const encode = stubImageBrowser()
    encode.mockImplementation(() => {
      throw new Error('Canvas failed')
    })
    await expect(
      processImageFile(new File(['png'], 'a.png', { type: 'image/png' })),
    ).rejects.toThrow('Canvas failed')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test')
  })

  it('preserves GIF animation instead of flattening a large GIF through canvas', async () => {
    vi.stubGlobal(
      'FileReader',
      class {
        result = 'data:image/gif;base64,YQ=='
        onload = () => {}
        readAsDataURL() {
          queueMicrotask(() => this.onload())
        }
      },
    )
    const file = { size: 300 * 1024, type: 'image/gif', name: '动画.gif' } as File
    expect((await processImageFile(file)).markdown).toContain('data:image/gif;base64,YQ==')
  })

  it('rejects unsupported file types and oversized files before decoding them', async () => {
    await expect(
      processImageFile(new File(['svg'], 'a.svg', { type: 'image/svg+xml' })),
    ).rejects.toThrow('暂仅支持')
    await expect(
      processImageFile({ size: 11 * 1024 * 1024, type: 'image/png' } as File),
    ).rejects.toThrow('超过 10 MB')
  })

  it('rejects excessive decoded dimensions and invalid resize parameters', async () => {
    stubImageBrowser(10_000, 10_000)
    const file = new File(['png'], 'a.png', { type: 'image/png' })
    await expect(processImageFile(file)).rejects.toThrow('超过 4000 万像素')
    await expect(processImageFile(file, { maxWidth: 0 })).rejects.toThrow('参数无效')
  })
})
