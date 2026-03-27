export const desktopApi = window.desktopApi || {
  getClients: async () => [],
  upsertClient: async () => ({ ok: false }),
  deleteClient: async () => ({ ok: false }),
  getDocumentsByClient: async () => [],
  insertDocumentRecord: async () => ({ ok: false }),
  updateDocumentValidation: async () => ({ ok: false }),
  pickAndAttach: async () => [],
  exportClientZip: async () => ({ ok: false }),
  openFile: async () => {},
};
