const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  getMimoStatus: () => ipcRenderer.invoke('mimo:status'),
  formatMimo: async (request, onChunk) => {
    const listener = (_event, payload) => {
      if (payload?.requestId === request.requestId) onChunk(payload.text)
    }
    ipcRenderer.on('mimo:chunk', listener)
    try {
      return await ipcRenderer.invoke('mimo:format', request)
    } finally {
      ipcRenderer.removeListener('mimo:chunk', listener)
    }
  },
  cancelMimo: (requestId) => ipcRenderer.send('mimo:cancel', requestId),
  openFeedbackEmail: (mailto) => ipcRenderer.invoke('feedback:open-email', mailto),
})
