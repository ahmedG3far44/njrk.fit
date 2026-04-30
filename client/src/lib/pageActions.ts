export const shareCurrentView = async (title: string, text: string, url: string) => {
  if (navigator.share) {
    await navigator.share({ title, text, url })
    return
  }

  await navigator.clipboard.writeText(url)
  window.alert('Share link copied to clipboard.')
}

export const downloadBlob = (blob: Blob, filename: string) => {
  const objectUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(objectUrl)
}
