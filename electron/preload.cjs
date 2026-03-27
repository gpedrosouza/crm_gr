const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopApi", {
  getClients: () => ipcRenderer.invoke("db:getClients"),
  upsertClient: (payload) => ipcRenderer.invoke("db:upsertClient", payload),
  deleteClient: (cnpj) => ipcRenderer.invoke("db:deleteClient", cnpj),
  getDocumentsByClient: (cnpj) => ipcRenderer.invoke("db:getDocumentsByClient", cnpj),
  insertDocumentRecord: (payload) => ipcRenderer.invoke("db:insertDocumentRecord", payload),
  updateDocumentValidation: (payload) => ipcRenderer.invoke("db:updateDocumentValidation", payload),
  pickAndAttach: (payload) => ipcRenderer.invoke("files:pickAndAttach", payload),
  exportClientZip: (cnpj) => ipcRenderer.invoke("files:exportClientZip", cnpj),
  openFile: (filePath) => ipcRenderer.invoke("shell:openFile", filePath),
});
