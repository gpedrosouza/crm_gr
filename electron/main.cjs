const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");

const {
  initDb,
  getClients,
  upsertClient,
  deleteClient,
  getDocumentsByClient,
  insertDocumentRecord,
  updateDocumentValidation,
} = require("./db.cjs");

const {
  ensureClientFolders,
  copyFilesToClientFolder,
  deleteClientFolder,
  createClientZip,
} = require("./storage.cjs");

const isDev = !app.isPackaged;
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  initDb(app.getPath("userData"));
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("db:getClients", async () => {
  return getClients();
});

ipcMain.handle("db:upsertClient", async (_, payload) => {
  return upsertClient(payload);
});

ipcMain.handle("db:deleteClient", async (_, cnpj) => {
  deleteClientFolder(app.getPath("documents"), cnpj);
  return deleteClient(cnpj);
});

ipcMain.handle("db:getDocumentsByClient", async (_, cnpj) => {
  return getDocumentsByClient(cnpj);
});

ipcMain.handle("db:insertDocumentRecord", async (_, payload) => {
  return insertDocumentRecord(payload);
});

ipcMain.handle("db:updateDocumentValidation", async (_, payload) => {
  return updateDocumentValidation(payload);
});

ipcMain.handle("files:pickAndAttach", async (_, payload) => {
  const { cnpj, scope, owner, documentName } = payload;

  const result = await dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"],
    filters: [
      {
        name: "Documentos",
        extensions: ["pdf", "png", "jpg", "jpeg", "doc", "docx", "xls", "xlsx"],
      },
      { name: "Todos", extensions: ["*"] },
    ],
  });

  if (result.canceled || !result.filePaths.length) {
    return [];
  }

  const targetDir = ensureClientFolders(
    app.getPath("documents"),
    cnpj,
    scope,
    owner,
    documentName
  );

  return copyFilesToClientFolder(result.filePaths, targetDir);
});

ipcMain.handle("files:exportClientZip", async (_, cnpj) => {
  const result = await dialog.showSaveDialog({
    defaultPath: path.join(app.getPath("downloads"), `${cnpj}.zip`),
    filters: [{ name: "Arquivo ZIP", extensions: ["zip"] }],
  });

  if (result.canceled || !result.filePath) {
    return { ok: false, canceled: true };
  }

  const zipPath = await createClientZip(app.getPath("documents"), cnpj, result.filePath);

  return { ok: true, path: zipPath };
});

ipcMain.handle("shell:openFile", async (_, filePath) => {
  return shell.openPath(filePath);
});
