function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadCsv(content: string, filename: string): void {
  downloadFile(content, filename, 'text/csv;charset=utf-8;')
}

export function downloadText(content: string, filename: string): void {
  downloadFile(content, filename, 'text/plain;charset=utf-8;')
}
