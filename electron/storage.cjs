const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

function sanitize(value) {
  return String(value || "sem_nome")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._ -]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

function ensureClientFolders(documentsPath, cnpj, scope, owner, documentName) {
  const cnpjSafe = sanitize(cnpj);
  const scopeSafe = sanitize(scope);
  const ownerSafe = sanitize(owner);
  const docSafe = sanitize(documentName);

  const fullPath = path.join(
    documentsPath,
    "GR_Assessoria",
    cnpjSafe,
    scopeSafe,
    ownerSafe,
    docSafe
  );

  return ensureDir(fullPath);
}

function copyFilesToClientFolder(filePaths, targetDir) {
  return filePaths.map((sourcePath) => {
    const originalName = path.basename(sourcePath);
    const safeName = sanitize(originalName);
    const targetPath = path.join(targetDir, safeName);

    fs.copyFileSync(sourcePath, targetPath);
    const stats = fs.statSync(targetPath);

    return {
      name: safeName,
      originalName,
      path: targetPath,
      size: stats.size,
      type: path.extname(targetPath).replace(".", "").toLowerCase(),
      uploadedAt: new Date().toISOString(),
    };
  });
}

function deleteClientFolder(documentsPath, cnpj) {
  const cnpjSafe = sanitize(cnpj);
  const clientDir = path.join(documentsPath, "GR_Assessoria", cnpjSafe);

  if (fs.existsSync(clientDir)) {
    fs.rmSync(clientDir, { recursive: true, force: true });
  }
}

function getClientFolder(documentsPath, cnpj) {
  const cnpjSafe = sanitize(cnpj);
  return path.join(documentsPath, "GR_Assessoria", cnpjSafe);
}

function createClientZip(documentsPath, cnpj, zipPath) {
  const clientDir = getClientFolder(documentsPath, cnpj);

  if (!fs.existsSync(clientDir)) {
    throw new Error("Nenhum arquivo foi encontrado para este CNPJ.");
  }

  return new Promise((resolve, reject) => {
    execFile(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "Compress-Archive -LiteralPath $args[0] -DestinationPath $args[1] -Force",
        clientDir,
        zipPath,
      ],
      (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(zipPath);
      }
    );
  });
}

module.exports = {
  ensureClientFolders,
  copyFilesToClientFolder,
  deleteClientFolder,
  createClientZip,
};
