export function useSmartFormat() {
  function formatMarkdown(input: string): string {
    return input
      .replace(/([一-鿿])([a-zA-Z0-9])/g, '$1 $2')
      .replace(/([a-zA-Z0-9])([一-鿿])/g, '$1 $2')
      .replace(/([一-鿿])([0-9])/g, '$1 $2')
      .replace(/([0-9])([一-鿿])/g, '$1 $2')
      .replace(/([^-])--([^-])/g, '$1——$2')
      .replace(/\.\.\./g, '…')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/^(#{1,6})([^\s#])/gm, '$1 $2')
      .replace(/^([-+])(?![-+])([^\s])/gm, '$1 $2')
      .replace(/^(\*)(?!\*)([^\s])/gm, '$1 $2')
      .replace(/^(\d+\.)([^\s])/gm, '$1 $2')
  }

  return { formatMarkdown }
}
