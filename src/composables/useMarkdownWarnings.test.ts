import { describe, expect, it } from 'vitest'
import { useMarkdownWarnings } from '@/composables/useMarkdownWarnings'

describe('useMarkdownWarnings', () => {
  it('keeps relative images blocking but treats embedded images as reviewable', () => {
    const relative = useMarkdownWarnings({ value: '![图](./image.png)' }).warnings.value
    const embedded = useMarkdownWarnings({
      value: '![图](data:image/png;base64,AAAA)',
    }).warnings.value

    expect(relative.some((warning) => warning.level === 'danger')).toBe(true)
    expect(embedded.some((warning) => warning.level === 'danger')).toBe(false)
    expect(embedded.some((warning) => warning.type === 'embeddedImage')).toBe(true)
  })
})
