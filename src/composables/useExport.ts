export function useExport() {
  function exportHtml(html: string) {
    const fullHtml = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>微信公众号排版导出</title>
  </head>
  <body>
    ${html}
  </body>
</html>`
    const stamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '')
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `wechat-article-${stamp}.html`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return { exportHtml }
}
