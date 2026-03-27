import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  FileText,
  Building2,
  Moon,
  Sun,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Filter,
  Menu,
  Trash2,
  Plus,
  Eye,
} from "lucide-react";
import { desktopApi } from "./services/desktopApi";
import appLogoImage from "./assets/logo-app.png";
import pdfLogoImage from "./assets/logo.png";

const BRAND = {
  light: "#00B3A9",
  dark: "#003650",
};

const COMPANY_DOCS = [
  "Contrato Social/Estatuto Social (Última alteração consolidada)",
  "Comprovante de endereço da empresa",
  "Balanço e DRE dos últimos exercícios",
  "Faturamento Contábil dos últimos 12 meses",
  "Declaração de Endividamento",
  "Curva ABC de clientes",
  "Borderôs de Operação de Desconto recentes",
  "Fotos da empresa",
];

const PARTNER_DOCS = [
  "Cópia RG e CPF (Emissão inferior a 10 anos)",
  "Comprovante de endereço",
  "Declaração de IR mais recente",
  "Certidão de Casamento ou divórcio, quando aplicável",
];

const STATUS_META = {
  pendente: {
    label: "Pendente",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: AlertCircle,
  },
  correto: {
    label: "Correto",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
  },
  incorreto: {
    label: "Incorreto",
    color: "bg-rose-100 text-rose-800 border-rose-200",
    icon: XCircle,
  },
};

const SAMPLE_DATA = [
  {
    cnpj: "12.345.678/0001-90",
    empresa: "Exemplo Indústria Ltda",
    situacao: "ATIVA",
    porte: "Demais",
    municipio: "São Carlos",
    uf: "SP",
    telefone: "(16) 99999-9999",
    email: "contato@exemplo.com",
    atividade_principal: "Comércio varejista especializado",
    socios: ["Ana Pereira", "Carlos Souza"],
    observacoes: "Cliente com bom histórico de atendimento.",
  },
  {
    cnpj: "98.765.432/0001-10",
    empresa: "GR Soluções Comerciais ME",
    situacao: "ATIVA",
    porte: "ME",
    municipio: "Rio Claro",
    uf: "SP",
    telefone: "(19) 98888-1111",
    email: "financeiro@grsolucoes.com",
    atividade_principal: "Serviços combinados de escritório",
    socios: ["Mariana Costa"],
    observacoes: "Aguardando atualização de balanço.",
  },
];

const EMPTY_CLIENT_FORM = {
  empresa: "",
  cnpj: "",
  situacao: "",
  porte: "",
  municipio: "",
  uf: "",
  telefone: "",
  email: "",
  atividade_principal: "",
  socios: "",
  observacoes: "",
};

function normalizeDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function cnpjMask(value) {
  const digits = normalizeDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function makeRequiredDocs(record) {
  const partnerNames = record.socios?.length ? record.socios : ["Sócio 1"];

  const companyDocs = COMPANY_DOCS.map((name) => ({
    id: `empresa-${record.cnpj}-${name}`,
    scope: "empresa",
    owner: record.empresa || "Empresa",
    name,
    justification: "",
    notes: "",
    status: "pendente",
  }));

  const partnerDocs = partnerNames.flatMap((partner) =>
    PARTNER_DOCS.map((name) => ({
      id: `socio-${record.cnpj}-${partner}-${name}`,
      scope: "socio",
      owner: partner,
      name,
      justification: "",
      notes: "",
      status: "pendente",
    }))
  );

  return [...companyDocs, ...partnerDocs];
}

function hydrateRecords(records) {
  return (records || []).map((record, index) => ({
    ...record,
    id: record.id ?? `${record.cnpj || "sem-cnpj"}-${index}`,
    documentos: makeRequiredDocs(record),
  }));
}

function Logo({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={appLogoImage}
        alt="GR Assessoria Financeira"
        className={
          compact
            ? "h-12 w-auto max-w-[160px] object-contain object-left"
            : "h-16 w-auto max-w-[240px] object-contain object-left"
        }
      />
      {!compact && (
        <div className="sr-only">GR Assessoria Financeira</div>
      )}
    </div>
  );
}

let pdfLogoDataUrlPromise;

function getPdfLogoDataUrl() {
  if (!pdfLogoDataUrlPromise) {
    pdfLogoDataUrlPromise = fetch(pdfLogoImage)
      .then((response) => response.blob())
      .then(
        (blob) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
      );
  }

  return pdfLogoDataUrlPromise;
}

function StatCard({ title, value, subtitle, darkMode, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border p-5 shadow-sm ${
        darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm opacity-70">{title}</p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
          <p className="mt-2 text-sm opacity-70">{subtitle}</p>
        </div>
        <div
          className="rounded-2xl p-3"
          style={{ backgroundColor: `${BRAND.light}22` }}
        >
          <Icon size={22} style={{ color: BRAND.light }} />
        </div>
      </div>
    </motion.div>
  );
}

function Pill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pendente;
  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${meta.color}`}
    >
      <Icon size={14} />
      {meta.label}
    </span>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold">{title}</h2>
      {subtitle && <p className="mt-1 text-sm opacity-70">{subtitle}</p>}
    </div>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("clientes");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [selectedId, setSelectedId] = useState(null);
  const [records, setRecords] = useState([]);
  const [dbDocuments, setDbDocuments] = useState([]);
  const [docDrafts, setDocDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [newClientForm, setNewClientForm] = useState(EMPTY_CLIENT_FORM);
  const [newClientErrors, setNewClientErrors] = useState({});
  const [isSavingClient, setIsSavingClient] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    async function loadClients() {
      setLoading(true);
      try {
        const clients = await desktopApi.getClients();

        if (clients.length) {
          const hydrated = hydrateRecords(clients);
          setRecords(hydrated);
          setSelectedId(hydrated[0]?.id || null);
        } else {
          for (const client of SAMPLE_DATA) {
            await desktopApi.upsertClient(client);
          }
          const refreshed = await desktopApi.getClients();
          const hydrated = hydrateRecords(refreshed);
          setRecords(hydrated);
          setSelectedId(hydrated[0]?.id || null);
        }
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
        const hydrated = hydrateRecords(SAMPLE_DATA);
        setRecords(hydrated);
        setSelectedId(hydrated[0]?.id || null);
      } finally {
        setLoading(false);
      }
    }

    loadClients();
  }, []);

  const selectedRecord = useMemo(
    () => records.find((item) => String(item.id) === String(selectedId)) || records[0],
    [records, selectedId]
  );

  useEffect(() => {
    async function loadDocuments() {
      if (!selectedRecord?.cnpj) {
        setDbDocuments([]);
        return;
      }

      try {
        const docs = await desktopApi.getDocumentsByClient(selectedRecord.cnpj);
        setDbDocuments(docs || []);
      } catch (error) {
        console.error("Erro ao carregar documentos:", error);
        setDbDocuments([]);
      }
    }

    loadDocuments();
  }, [selectedRecord?.cnpj]);

  const selectedDocs = selectedRecord?.documentos || [];

  const filteredRecords = useMemo(() => {
    const q = search.toLowerCase().trim();

    return records.filter((record) => {
      const matchesSearch =
        !q ||
        record.empresa?.toLowerCase().includes(q) ||
        record.cnpj?.toLowerCase().includes(q) ||
        record.municipio?.toLowerCase().includes(q) ||
        record.email?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterStatus === "todos") return true;

      const hasMatchingStatus = makeRequiredDocs(record).some((docItem) => {
        const files = dbDocuments.filter(
          (f) =>
            f.cnpj === record.cnpj &&
            f.document_name === docItem.name &&
            f.owner === docItem.owner &&
            f.scope === docItem.scope
        );

        if (!files.length) return filterStatus === "pendente";

        return files[0]?.status === filterStatus;
      });

      return hasMatchingStatus;
    });
  }, [records, search, filterStatus, dbDocuments]);

  const documentSummary = useMemo(() => {
    const allRequired = records.flatMap((r) => makeRequiredDocs(r));

    let correto = 0;
    let incorreto = 0;
    let pendente = 0;

    for (const docItem of allRequired) {
      const files = dbDocuments.filter(
        (f) =>
          f.cnpj === docItem.id.split("-")[1] &&
          f.document_name === docItem.name &&
          f.owner === docItem.owner &&
          f.scope === docItem.scope
      );

      if (!files.length) {
        pendente += 1;
      } else {
        const latest = files[0];
        if (latest.status === "correto") correto += 1;
        else if (latest.status === "incorreto") incorreto += 1;
        else pendente += 1;
      }
    }

    return {
      total: allRequired.length,
      correto,
      incorreto,
      pendente,
    };
  }, [records, dbDocuments]);

  const selectedStats = useMemo(() => {
    let correto = 0;
    let incorreto = 0;
    let pendente = 0;

    for (const docItem of selectedDocs) {
      const files = dbDocuments.filter(
        (f) =>
          f.document_name === docItem.name &&
          f.owner === docItem.owner &&
          f.scope === docItem.scope
      );

      if (!files.length) {
        pendente += 1;
      } else {
        const latest = files[0];
        if (latest.status === "correto") correto += 1;
        else if (latest.status === "incorreto") incorreto += 1;
        else pendente += 1;
      }
    }

    return {
      total: selectedDocs.length,
      correto,
      incorreto,
      pendente,
    };
  }, [selectedDocs, dbDocuments]);

  const macroSummary = useMemo(() => {
    const perClient = records.map((record) => {
      const requiredDocs = makeRequiredDocs(record);

      let correto = 0;
      let incorreto = 0;
      let pendente = 0;

      for (const docItem of requiredDocs) {
        const files = dbDocuments.filter(
          (f) =>
            f.cnpj === record.cnpj &&
            f.document_name === docItem.name &&
            f.owner === docItem.owner &&
            f.scope === docItem.scope
        );

        if (!files.length) {
          pendente += 1;
        } else {
          const latest = files[0];
          if (latest.status === "correto") correto += 1;
          else if (latest.status === "incorreto") incorreto += 1;
          else pendente += 1;
        }
      }

      return {
        id: record.id,
        empresa: record.empresa || "Empresa sem nome",
        cnpj: record.cnpj || "Sem CNPJ",
        total: requiredDocs.length,
        correto,
        incorreto,
        pendente,
      };
    });

    const clientsWithPending = perClient.filter((item) => item.pendente > 0).length;
    const clientsCompleted = perClient.filter(
      (item) => item.total > 0 && item.pendente === 0 && item.incorreto === 0
    ).length;
    const clientsWithIssues = perClient.filter((item) => item.incorreto > 0).length;
    const topPendingClients = [...perClient]
      .sort((a, b) => b.pendente - a.pendente || b.incorreto - a.incorreto)
      .slice(0, 5);

    const completionRate = documentSummary.total
      ? Math.round((documentSummary.correto / documentSummary.total) * 100)
      : 0;

    return {
      clientsWithPending,
      clientsCompleted,
      clientsWithIssues,
      topPendingClients,
      completionRate,
    };
  }, [records, dbDocuments, documentSummary]);

  function updateSelectedLocal(partial) {
    if (!selectedRecord) return;
    setRecords((prev) =>
      prev.map((item) =>
        String(item.id) === String(selectedRecord.id) ? { ...item, ...partial } : item
      )
    );
  }

  async function persistSelectedObservations(value) {
    if (!selectedRecord) return;

    updateSelectedLocal({ observacoes: value });

    try {
      await desktopApi.upsertClient({
        ...selectedRecord,
        observacoes: value,
      });
    } catch (error) {
      console.error("Erro ao salvar observações:", error);
    }
  }

  async function handleSpreadsheetUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportFeedback(null);

    try {
      let validRows = [];

      if (file.name.toLowerCase().endsWith(".csv")) {
        const text = await file.text();
        const rows = text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);

        if (!rows.length) {
          throw new Error("A planilha CSV está vazia.");
        }

        const delimiter = rows[0].includes(";") ? ";" : ",";
        const headers = rows[0].split(delimiter).map((h) => h.trim().toLowerCase());

        validRows = rows.slice(1).map((row) => {
          const cols = row.split(delimiter);
          const obj = Object.fromEntries(headers.map((h, i) => [h, cols[i] || ""]));

          return {
            cnpj: cnpjMask(obj.cnpj || obj.cnpj_limpo || obj.documento || ""),
            empresa:
              obj.empresa ||
              obj["razão social"] ||
              obj["razao social"] ||
              obj.nome ||
              "Empresa importada",
            situacao: obj.situacao || obj["situação"] || obj.status || "",
            porte: obj.porte || "",
            municipio: obj.municipio || obj.cidade || "",
            uf: obj.uf || "",
            telefone: obj.telefone || obj.fone || "",
            email: obj.email || "",
            atividade_principal:
              obj.atividade_principal || obj.cnae_principal || obj.cnae || "",
            socios: String(
              obj.socios || obj.resumo_socios || obj["quadro societário"] || ""
            )
              .replaceAll("|", ",")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            observacoes: obj.observacoes || obj["observação"] || obj["observacao"] || "",
          };
        });
      } else {
        const XLSX = await import("xlsx");
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        validRows = json.map((raw) => {
          const lowered = Object.fromEntries(
            Object.entries(raw).map(([k, v]) => [String(k).trim().toLowerCase(), v])
          );

          return {
            cnpj: cnpjMask(lowered.cnpj || lowered.cnpj_limpo || lowered.documento || ""),
            empresa:
              lowered.empresa ||
              lowered["razão social"] ||
              lowered["razao social"] ||
              lowered.nome ||
              "Empresa importada",
            situacao: lowered.situacao || lowered["situação"] || lowered.status || "",
            porte: lowered.porte || "",
            municipio: lowered.municipio || lowered.cidade || "",
            uf: lowered.uf || "",
            telefone: lowered.telefone || lowered.fone || "",
            email: lowered.email || "",
            atividade_principal:
              lowered.atividade_principal || lowered.cnae_principal || lowered.cnae || "",
            socios: String(
              lowered.socios || lowered.resumo_socios || lowered["quadro societário"] || ""
            )
              .replaceAll("|", ",")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            observacoes:
              lowered.observacoes || lowered["observação"] || lowered["observacao"] || "",
          };
        });
      }

      validRows = validRows.filter((item) => item.empresa || item.cnpj);

      if (!validRows.length) {
        throw new Error("Nenhuma linha válida foi encontrada para importação.");
      }

      for (const client of validRows) {
        await desktopApi.upsertClient(client);
      }

      const refreshed = await desktopApi.getClients();
      const hydrated = hydrateRecords(refreshed);

      setRecords(hydrated);
      setSelectedId(hydrated[0]?.id || null);
      setImportFeedback({
        type: "success",
        title: "Importação concluída",
        message: `${validRows.length} registro(s) carregado(s) com sucesso.`,
      });
      setIsImporting(false);
      event.target.value = "";
    } catch (error) {
      console.error(error);
      setImportFeedback({
        type: "error",
        title: "Falha na importação",
        message: error?.message || "Não foi possível importar a planilha.",
      });
      setIsImporting(false);
      event.target.value = "";
      return;
    }
  }

  function openNewClientPage() {
    setNewClientForm(EMPTY_CLIENT_FORM);
    setNewClientErrors({});
    setActiveTab("novo-cliente");
    setMobileOpen(false);
  }

  function updateNewClientField(field, value) {
    setNewClientForm((prev) => ({
      ...prev,
      [field]: field === "cnpj" ? cnpjMask(value) : value,
    }));
    setNewClientErrors((prev) => ({
      ...prev,
      [field]: "",
      form: "",
    }));
  }

  async function saveNewClient(event) {
    event.preventDefault();

    const nextErrors = {};

    if (!newClientForm.empresa.trim()) nextErrors.empresa = "Informe o nome da empresa.";
    if (!newClientForm.cnpj.trim()) nextErrors.cnpj = "Informe o CNPJ.";
    if (!newClientForm.municipio.trim()) nextErrors.municipio = "Informe a cidade.";

    if (Object.keys(nextErrors).length) {
      setNewClientErrors(nextErrors);
      return;
    }

    setIsSavingClient(true);
    setNewClientErrors({});

    try {
      const newRecord = {
        cnpj: newClientForm.cnpj,
        empresa: newClientForm.empresa.trim(),
        situacao: newClientForm.situacao.trim() || "Não informada",
        porte: newClientForm.porte.trim() || "Não informado",
        municipio: newClientForm.municipio.trim(),
        uf: newClientForm.uf.trim(),
        telefone: newClientForm.telefone.trim(),
        email: newClientForm.email.trim(),
        atividade_principal: newClientForm.atividade_principal.trim(),
        socios: newClientForm.socios
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        observacoes: newClientForm.observacoes.trim(),
      };

      await desktopApi.upsertClient(newRecord);
      const refreshed = await desktopApi.getClients();
      const hydrated = hydrateRecords(refreshed);
      const createdRecord =
        hydrated.find((item) => item.cnpj === newRecord.cnpj) || hydrated[0] || null;

      setRecords(hydrated);
      setSelectedId(createdRecord?.id || null);
      setNewClientForm(EMPTY_CLIENT_FORM);
      setActiveTab("clientes");
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error);
      setNewClientErrors({
        form: "Não foi possível salvar o novo cliente.",
      });
    } finally {
      setIsSavingClient(false);
    }
  }

  function requestDeleteClient(record) {
    if (!record?.cnpj) return;
    setDeleteCandidate(record);
  }

  async function confirmDeleteClient() {
    if (!deleteCandidate?.cnpj) return;

    setIsDeletingClient(true);

    try {
      await desktopApi.deleteClient(deleteCandidate.cnpj);
      const refreshed = await desktopApi.getClients();
      const hydrated = hydrateRecords(refreshed);

      setRecords(hydrated);
      setSelectedId(hydrated[0]?.id || null);
      setDbDocuments([]);
      setDeleteCandidate(null);

      if (!hydrated.length) {
        setActiveTab("clientes");
      }
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      setImportFeedback({
        type: "error",
        title: "Falha na exclusão",
        message: "Não foi possível excluir o cadastro selecionado.",
      });
    } finally {
      setIsDeletingClient(false);
    }
  }

  async function exportClientZip(record) {
    if (!record?.cnpj) return;

    setIsExportingZip(true);

    try {
      const result = await desktopApi.exportClientZip(record.cnpj);

      if (result?.canceled) return;

      if (!result?.ok) {
        throw new Error("Não foi possível gerar o arquivo ZIP.");
      }

      setImportFeedback({
        type: "success",
        title: "ZIP gerado com sucesso",
        message: `Todos os documentos do CNPJ ${record.cnpj} foram exportados para ${result.path}.`,
      });
    } catch (error) {
      console.error("Erro ao exportar ZIP:", error);
      setImportFeedback({
        type: "error",
        title: "Falha ao exportar ZIP",
        message: error?.message || "Não foi possível gerar o ZIP deste CNPJ.",
      });
    } finally {
      setIsExportingZip(false);
    }
  }

  async function attachRealFiles(docItem) {
    if (!selectedRecord?.cnpj) return;

    const files = await desktopApi.pickAndAttach({
      cnpj: selectedRecord.cnpj,
      scope: docItem.scope,
      owner: docItem.owner,
      documentName: docItem.name,
    });

    if (!files.length) return;

    for (const file of files) {
      await desktopApi.insertDocumentRecord({
        cnpj: selectedRecord.cnpj,
        scope: docItem.scope,
        owner: docItem.owner,
        document_name: docItem.name,
        file_name: file.name,
        file_path: file.path,
        file_type: file.type,
        file_size: file.size,
        status: "pendente",
        justification: "",
        notes: "",
        uploaded_at: file.uploadedAt,
      });
    }

    const docs = await desktopApi.getDocumentsByClient(selectedRecord.cnpj);
    setDbDocuments(docs || []);
  }

  async function saveValidation(latestFileId, status, docKey) {
    if (!selectedRecord?.cnpj || !latestFileId) return;

    const draft = docDrafts[docKey] || { justification: "", notes: "" };

    await desktopApi.updateDocumentValidation({
      id: latestFileId,
      status,
      justification: draft.justification || "",
      notes: draft.notes || "",
    });

    const docs = await desktopApi.getDocumentsByClient(selectedRecord.cnpj);
    setDbDocuments(docs || []);
  }

  function setDraft(docKey, field, value) {
    setDocDrafts((prev) => ({
      ...prev,
      [docKey]: {
        ...(prev[docKey] || {}),
        [field]: value,
      },
    }));
  }

  function getDocUiStatus(docItem, filesForThisDoc) {
    if (!filesForThisDoc.length) return "pendente";
    return filesForThisDoc[0]?.status || "pendente";
  }

  async function exportChecklistPdf(record) {
    const { jsPDF } = await import("jspdf");
    const logoDataUrl = await getPdfLogoDataUrl();
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const marginX = 42;
    const pageWidth = 595;
    const pageHeight = 842;
    const lineHeight = 12;
    const cellPaddingX = 6;
    const cellPaddingY = 8;
    let y = 48;

    function drawPdfHeader() {
      doc.setFillColor(0, 54, 80);
      doc.rect(0, 0, pageWidth, 96, "F");

      doc.addImage(logoDataUrl, "PNG", marginX, 20, 210, 52);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Resumo simplificado da documentação", pageWidth - marginX, 46, {
        align: "right",
      });
    }

    drawPdfHeader();

    y = 126;
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`Empresa: ${record.empresa || "-"}`, marginX, y);
    y += 20;
    doc.setFont("helvetica", "normal");
    doc.text(`CNPJ: ${record.cnpj || "-"}`, marginX, y);
    y += 20;
    doc.text(`Situação: ${record.situacao || "-"}`, marginX, y);
    y += 28;

    const lines = [
      ["Documento", "Responsável", "Status", "Justificativa"],
      ...record.documentos.map((d) => {
        const filesForThisDoc = dbDocuments.filter(
          (f) =>
            f.document_name === d.name &&
            f.owner === d.owner &&
            f.scope === d.scope
        );
        const latest = filesForThisDoc[0];
        return [
          d.name,
          d.owner,
          STATUS_META[latest?.status || "pendente"]?.label || "Pendente",
          latest?.status === "incorreto"
            ? latest?.justification || "Não informado"
            : latest?.justification || "-",
        ];
      }),
    ];

    const widths = [220, 110, 70, 140];

    lines.forEach((row, rowIndex) => {
      const rowLines = row.map((cell, i) =>
        doc.splitTextToSize(String(cell || "-"), widths[i] - cellPaddingX * 2).slice(0, 3)
      );
      const maxLines = Math.max(...rowLines.map((content) => content.length));
      const rowHeight = Math.max(30, cellPaddingY * 2 + maxLines * lineHeight);

      if (y + rowHeight > pageHeight - 54) {
        doc.addPage();
        drawPdfHeader();
        y = 126;
      }

      let x = marginX;
      row.forEach((cell, i) => {
        if (rowIndex === 0) {
          doc.setFillColor(0, 179, 169);
          doc.rect(x, y - cellPaddingY - 2, widths[i], rowHeight, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
        } else {
          doc.setFillColor(rowIndex % 2 === 0 ? 248 : 255, 250, 252);
          doc.rect(x, y - cellPaddingY - 2, widths[i], rowHeight, "F");
          doc.setTextColor(15, 23, 42);
          doc.setFont("helvetica", "normal");
        }

        const content = rowLines[i];
        doc.text(content, x + cellPaddingX, y + 2);
        x += widths[i];
      });
      y += rowHeight;
    });

    y += 20;
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, marginX, y);

    doc.save(`checklist_${(record.empresa || "cliente").replace(/\s+/g, "_")}.pdf`);
  }

  const shellClasses = darkMode
    ? "bg-slate-950 text-slate-100"
    : "bg-slate-50 text-slate-900";

  const panelClass = darkMode
    ? "bg-slate-900 border-slate-800"
    : "bg-white border-slate-200";

  const sideNav = (
    <div
      className={`flex h-full flex-col border-r ${panelClass} ${
        darkMode ? "text-slate-100" : "text-slate-900"
      }`}
    >
      <div className="flex items-center justify-between px-5 py-5">
        <Logo compact={false} />
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={openNewClientPage}
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-medium text-white shadow-sm"
          style={{ backgroundColor: BRAND.light }}
        >
          <Plus size={18} />
          Novo cliente
        </button>
      </div>

      <nav className="space-y-1 px-3">
        {[
          { key: "clientes", label: "Clientes", icon: Building2 },
          { key: "resumo", label: "Resumo", icon: Eye },
        ].map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.key;

          return (
            <button
              key={item.key}
              onClick={() => {
                setActiveTab(item.key);
                setMobileOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                active ? "text-white" : darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
              }`}
              style={active ? { backgroundColor: BRAND.dark } : {}}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto px-4 pb-6 pt-6">
        <div className={`rounded-3xl border p-4 ${panelClass}`}>
          <p className="text-sm opacity-70">Tema</p>
          <div
            className="mt-3 flex items-center justify-between rounded-2xl border px-3 py-2"
            style={{ borderColor: `${BRAND.light}55` }}
          >
            <span className="text-sm">Modo noturno</span>
            <button
              onClick={() => setDarkMode((v) => !v)}
              className="rounded-full p-2"
              style={{ backgroundColor: `${BRAND.light}22` }}
            >
              {darkMode ? (
                <Moon size={16} style={{ color: BRAND.light }} />
              ) : (
                <Sun size={16} style={{ color: BRAND.dark }} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        Carregando sistema...
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${shellClasses}`}>
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[300px_1fr]">
        <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen">{sideNav}</div>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 grid grid-cols-[280px_1fr] lg:hidden">
            <div className="z-50">{sideNav}</div>
            <button className="bg-black/40" onClick={() => setMobileOpen(false)} />
          </div>
        )}

        <main className="min-w-0">
          <header
            className={`sticky top-0 z-30 border-b backdrop-blur ${
              darkMode
                ? "border-slate-800 bg-slate-950/85"
                : "border-slate-200 bg-slate-50/85"
            }`}
          >
            <div className="flex flex-wrap items-center gap-3 px-4 py-4 md:px-6">
              <button
                className={`rounded-2xl border p-3 lg:hidden ${panelClass}`}
                onClick={() => setMobileOpen(true)}
              >
                <Menu size={18} />
              </button>

              <div className="min-w-[220px] flex-1">
                <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${panelClass}`}>
                  <Search size={18} className="opacity-60" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por empresa, CNPJ, cidade ou e-mail"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 rounded-2xl border px-3 py-3 ${panelClass}`}>
                  <Filter size={16} className="opacity-60" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-transparent text-sm outline-none"
                  >
                    <option value="todos">Todos</option>
                    <option value="pendente">Pendente</option>
                    <option value="correto">Correto</option>
                    <option value="incorreto">Incorreto</option>
                  </select>
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-white"
                  style={{
                    backgroundColor: BRAND.dark,
                    opacity: isImporting ? 0.7 : 1,
                    cursor: isImporting ? "wait" : "pointer",
                  }}
                >
                  {isImporting ? "Importando..." : "Importar planilha"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  className="hidden"
                  onChange={handleSpreadsheetUpload}
                />
              </div>
            </div>
          </header>

          <div className="space-y-6 px-4 py-5 md:px-6 md:py-6">
            {activeTab === "clientes" && (
              <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
                <div className={`rounded-3xl border ${panelClass}`}>
                  <div
                    className="border-b px-5 py-4"
                    style={{ borderColor: darkMode ? "#1E293B" : "#E2E8F0" }}
                  >
                    <SectionTitle
                      title="Empresas"
                      subtitle="Selecione um cliente para ver mais detalhes"
                    />
                  </div>

                  <div className="max-h-[70vh] overflow-auto p-3">
                    <div className="space-y-3">
                      {filteredRecords.map((record) => {
                        const active = String(selectedId) === String(record.id);

                        const pendentes = makeRequiredDocs(record).filter((docItem) => {
                          const files = dbDocuments.filter(
                            (f) =>
                              f.cnpj === record.cnpj &&
                              f.document_name === docItem.name &&
                              f.owner === docItem.owner &&
                              f.scope === docItem.scope
                          );
                          return !files.length || files[0]?.status === "pendente";
                        }).length;

                        return (
                          <button
                            key={record.id}
                            onClick={() => setSelectedId(record.id)}
                            className={`w-full rounded-3xl border p-4 text-left transition ${
                              active
                                ? "shadow-md"
                                : darkMode
                                ? "hover:bg-slate-800"
                                : "hover:bg-slate-50"
                            } ${darkMode ? "border-slate-800" : "border-slate-200"}`}
                            style={
                              active
                                ? {
                                    borderColor: BRAND.light,
                                    backgroundColor: `${BRAND.light}15`,
                                  }
                                : {}
                            }
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold leading-tight">{record.empresa}</p>
                                <p className="mt-1 text-sm opacity-70">{record.cnpj || "Sem CNPJ"}</p>
                              </div>
                              <Pill status={pendentes ? "pendente" : "correto"} />
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2 text-xs opacity-75">
                              <span>{record.municipio || "Cidade não informada"}</span>
                              <span>•</span>
                              <span>{record.uf || "UF"}</span>
                              <span>•</span>
                              <span>{record.situacao || "Situação"}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {selectedRecord && (
                  <div className="space-y-6">
                    <div className={`rounded-3xl border p-6 ${panelClass}`}>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h1 className="text-3xl font-semibold">{selectedRecord.empresa}</h1>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Pill
                              status={
                                selectedRecord.situacao?.toLowerCase() === "ativa"
                                  ? "correto"
                                  : "pendente"
                              }
                            />
                            <span
                              className="rounded-full px-3 py-1 text-xs font-medium"
                              style={{
                                backgroundColor: `${BRAND.light}22`,
                                color: BRAND.light,
                              }}
                            >
                              {selectedRecord.porte || "Porte não informado"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => requestDeleteClient(selectedRecord)}
                            className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white"
                            style={{ backgroundColor: "#E11D48" }}
                          >
                            <Trash2 size={16} />
                            Excluir cadastro
                          </button>
                          <button
                            onClick={() => setActiveTab("documentos")}
                            className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white"
                            style={{ backgroundColor: BRAND.dark }}
                          >
                            <FileText size={16} />
                            Documentação
                          </button>
                          <button
                            onClick={() => exportClientZip(selectedRecord)}
                            disabled={isExportingZip}
                            className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white"
                            style={{
                              backgroundColor: "#0F766E",
                              opacity: isExportingZip ? 0.7 : 1,
                              cursor: isExportingZip ? "wait" : "pointer",
                            }}
                          >
                            <Download size={16} />
                            {isExportingZip ? "Gerando ZIP..." : "Baixar ZIP"}
                          </button>
                          <button
                            onClick={() => exportChecklistPdf(selectedRecord)}
                            className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white"
                            style={{ backgroundColor: BRAND.light }}
                          >
                            <Download size={16} />
                            Baixar PDF
                          </button>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {[
                          ["CNPJ", selectedRecord.cnpj],
                          ["Cidade / UF", `${selectedRecord.municipio || "-"} / ${selectedRecord.uf || "-"}`],
                          ["Telefone", selectedRecord.telefone || "-"],
                          ["E-mail", selectedRecord.email || "-"],
                          ["Atividade principal", selectedRecord.atividade_principal || "-"],
                          ["Sócios", (selectedRecord.socios || []).join(", ") || "-"],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className={`rounded-2xl border p-4 ${
                              darkMode
                                ? "border-slate-800 bg-slate-950"
                                : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            <p className="text-sm opacity-70">{label}</p>
                            <p className="mt-2 break-words text-sm font-medium leading-relaxed">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={`rounded-3xl border p-6 ${panelClass}`}>
                      <SectionTitle
                        title="Anotações internas"
                        subtitle="Observações gerais do atendimento"
                      />
                      <textarea
                        value={selectedRecord.observacoes || ""}
                        onChange={(e) => updateSelectedLocal({ observacoes: e.target.value })}
                        onBlur={(e) => persistSelectedObservations(e.target.value)}
                        rows={6}
                        placeholder="Escreva observações, pendências, contexto comercial e próximos passos..."
                        className={`mt-4 w-full rounded-2xl border p-4 outline-none ${
                          darkMode
                            ? "border-slate-800 bg-slate-950"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      />
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeTab === "novo-cliente" && (
              <section className="mx-auto w-full max-w-5xl">
                <div className={`rounded-3xl border p-6 md:p-8 ${panelClass}`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <SectionTitle
                      title="Cadastrar novo cliente"
                      subtitle="Preencha os mesmos dados usados no painel do cliente"
                    />
                    <button
                      onClick={() => {
                        setActiveTab("clientes");
                        setNewClientErrors({});
                      }}
                      className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                        darkMode
                          ? "border-slate-700 hover:bg-slate-800"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Cancelar
                    </button>
                  </div>

                  <form onSubmit={saveNewClient} className="mt-6 space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {[
                        { key: "empresa", label: "Nome da empresa", required: true },
                        { key: "cnpj", label: "CNPJ", required: true },
                        { key: "municipio", label: "Cidade", required: true },
                        { key: "uf", label: "UF" },
                        { key: "situacao", label: "Situação" },
                        { key: "porte", label: "Porte" },
                        { key: "telefone", label: "Telefone" },
                        { key: "email", label: "E-mail" },
                        { key: "atividade_principal", label: "Atividade principal" },
                      ].map((field) => (
                        <label key={field.key} className="block">
                          <span className="text-sm font-medium">
                            {field.label}
                            {field.required ? " *" : ""}
                          </span>
                          <input
                            value={newClientForm[field.key]}
                            onChange={(e) =>
                              updateNewClientField(field.key, e.target.value)
                            }
                            className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none ${
                              darkMode
                                ? "border-slate-800 bg-slate-950"
                                : "border-slate-200 bg-slate-50"
                            }`}
                          />
                          {newClientErrors[field.key] && (
                            <p className="mt-2 text-xs text-rose-500">
                              {newClientErrors[field.key]}
                            </p>
                          )}
                        </label>
                      ))}
                    </div>

                    <label className="block">
                      <span className="text-sm font-medium">Sócios</span>
                      <input
                        value={newClientForm.socios}
                        onChange={(e) => updateNewClientField("socios", e.target.value)}
                        placeholder="Separe os nomes por vírgula"
                        className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none ${
                          darkMode
                            ? "border-slate-800 bg-slate-950"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium">Observações</span>
                      <textarea
                        value={newClientForm.observacoes}
                        onChange={(e) =>
                          updateNewClientField("observacoes", e.target.value)
                        }
                        rows={5}
                        className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none ${
                          darkMode
                            ? "border-slate-800 bg-slate-950"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      />
                    </label>

                    {newClientErrors.form && (
                      <div
                        className={`rounded-2xl border px-4 py-3 text-sm ${
                          darkMode
                            ? "border-rose-900 bg-rose-950/40 text-rose-200"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                        }`}
                      >
                        {newClientErrors.form}
                      </div>
                    )}

                    <div className="flex flex-wrap justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setNewClientForm(EMPTY_CLIENT_FORM);
                          setNewClientErrors({});
                        }}
                        className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                          darkMode
                            ? "border-slate-700 hover:bg-slate-800"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        Limpar
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingClient}
                        className="rounded-2xl px-5 py-3 text-sm font-medium text-white"
                        style={{
                          backgroundColor: BRAND.light,
                          opacity: isSavingClient ? 0.7 : 1,
                          cursor: isSavingClient ? "wait" : "pointer",
                        }}
                      >
                        {isSavingClient ? "Salvando..." : "Salvar cliente"}
                      </button>
                    </div>
                  </form>
                </div>
              </section>
            )}

            {activeTab === "documentos" && selectedRecord && (
              <section className="space-y-6">
                <div className={`rounded-3xl border p-6 ${panelClass}`}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => setActiveTab("clientes")}
                        className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                          darkMode
                            ? "border-slate-700 hover:bg-slate-800"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        Voltar
                      </button>
                      <SectionTitle
                        title="Documentação do cliente"
                        subtitle={`${selectedRecord.empresa} • ${selectedRecord.cnpj}`}
                      />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => exportClientZip(selectedRecord)}
                        disabled={isExportingZip}
                        className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white"
                        style={{
                          backgroundColor: "#0F766E",
                          opacity: isExportingZip ? 0.7 : 1,
                          cursor: isExportingZip ? "wait" : "pointer",
                        }}
                      >
                        <Download size={16} />
                        {isExportingZip ? "Gerando ZIP..." : "Baixar ZIP"}
                      </button>
                      <button
                        onClick={() => exportChecklistPdf(selectedRecord)}
                        className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white"
                        style={{ backgroundColor: BRAND.dark }}
                      >
                        <Download size={16} />
                        Exportar checklist
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                      title="Total"
                      value={selectedStats.total}
                      subtitle="Itens monitorados"
                      darkMode={darkMode}
                      icon={FileText}
                    />
                    <StatCard
                      title="Corretos"
                      value={selectedStats.correto}
                      subtitle="Aprovados"
                      darkMode={darkMode}
                      icon={CheckCircle2}
                    />
                    <StatCard
                      title="Pendentes"
                      value={selectedStats.pendente}
                      subtitle="Aguardando envio"
                      darkMode={darkMode}
                      icon={AlertCircle}
                    />
                    <StatCard
                      title="Incorretos"
                      value={selectedStats.incorreto}
                      subtitle="Precisam ajuste"
                      darkMode={darkMode}
                      icon={XCircle}
                    />
                  </div>
                </div>

                <div className="grid gap-4">
                  {selectedDocs.map((docItem) => {
                    const filesForThisDoc = dbDocuments.filter(
                      (f) =>
                        f.document_name === docItem.name &&
                        f.owner === docItem.owner &&
                        f.scope === docItem.scope
                    );

                    const latestFile = filesForThisDoc[0];
                    const uiStatus = getDocUiStatus(docItem, filesForThisDoc);
                    const docKey = `${docItem.scope}-${docItem.owner}-${docItem.name}`;
                    const draft = docDrafts[docKey] || {
                      justification: latestFile?.justification || "",
                      notes: latestFile?.notes || "",
                    };

                    return (
                      <motion.div
                        key={docItem.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-3xl border p-5 ${panelClass}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-lg font-semibold leading-tight">
                                {docItem.name}
                              </h3>
                              <Pill status={uiStatus} />
                            </div>
                            <p className="mt-2 text-sm opacity-70">
                              {docItem.scope === "empresa"
                                ? "Documento PJ"
                                : "Documento do sócio"}{" "}
                              • Responsável: {docItem.owner}
                            </p>
                          </div>

                          <button
                            onClick={() => attachRealFiles(docItem)}
                            className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white"
                            style={{ backgroundColor: BRAND.light }}
                          >
                            <Upload size={16} />
                            Inserir documento
                          </button>
                        </div>

                        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px]">
                          <div className="space-y-4">
                            <div>
                              <p className="mb-2 text-sm font-medium">Arquivos enviados</p>

                              {filesForThisDoc.length === 0 ? (
                                <div
                                  className={`rounded-2xl border border-dashed p-4 text-sm opacity-70 ${
                                    darkMode
                                      ? "border-slate-700 bg-slate-950"
                                      : "border-slate-300 bg-slate-50"
                                  }`}
                                >
                                  Nenhum arquivo inserido até o momento.
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {filesForThisDoc.map((f) => (
                                    <div
                                      key={f.id}
                                      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
                                        darkMode
                                          ? "border-slate-800 bg-slate-950"
                                          : "border-slate-200 bg-slate-50"
                                      }`}
                                    >
                                      <div>
                                        <p className="text-sm font-medium">{f.file_name}</p>
                                        <p className="text-xs opacity-70">
                                          {Math.max(
                                            1,
                                            Math.round((f.file_size || 0) / 1024)
                                          )}{" "}
                                          KB •{" "}
                                          {f.uploaded_at
                                            ? new Date(f.uploaded_at).toLocaleString("pt-BR")
                                            : "-"}
                                        </p>
                                      </div>

                                      <button
                                        onClick={() => desktopApi.openFile(f.file_path)}
                                        className="text-sm font-medium"
                                        style={{ color: BRAND.light }}
                                      >
                                        Visualizar
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="mb-2 text-sm font-medium">Justificativa rápida</p>
                              <textarea
                                value={draft.justification}
                                onChange={(e) =>
                                  setDraft(docKey, "justification", e.target.value)
                                }
                                rows={3}
                                placeholder="Ex.: comprovante vencido, documento ilegível, ausência de assinatura..."
                                className={`w-full rounded-2xl border p-4 outline-none ${
                                  darkMode
                                    ? "border-slate-800 bg-slate-950"
                                    : "border-slate-200 bg-slate-50"
                                }`}
                              />
                            </div>
                          </div>

                          <div
                            className={`rounded-2xl border p-4 ${
                              darkMode
                                ? "border-slate-800 bg-slate-950"
                                : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            <p className="text-sm font-medium">Validação</p>

                            <div className="mt-3 space-y-2">
                              {Object.entries(STATUS_META).map(([key, meta]) => (
                                <button
                                  key={key}
                                  onClick={() => saveValidation(latestFile?.id, key, docKey)}
                                  className={`w-full rounded-2xl border px-3 py-3 text-left text-sm ${
                                    uiStatus === key
                                      ? meta.color
                                      : darkMode
                                      ? "border-slate-800 hover:bg-slate-900"
                                      : "border-slate-200 hover:bg-white"
                                  }`}
                                >
                                  {meta.label}
                                </button>
                              ))}
                            </div>

                            <p className="mt-4 text-sm font-medium">Notas internas</p>
                            <textarea
                              value={draft.notes}
                              onChange={(e) => setDraft(docKey, "notes", e.target.value)}
                              rows={5}
                              placeholder="Critérios de validação, alinhamento com cliente, retorno do analista..."
                              className={`mt-2 w-full rounded-2xl border p-3 text-sm outline-none ${
                                darkMode
                                  ? "border-slate-800 bg-slate-900"
                                  : "border-slate-200 bg-white"
                              }`}
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {activeTab === "resumo" && (
              <div className="space-y-6">
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title="Empresas"
                    value={records.length}
                    subtitle="Base cadastrada"
                    darkMode={darkMode}
                    icon={Building2}
                  />
                  <StatCard
                    title="Documentos corretos"
                    value={documentSummary.correto}
                    subtitle="Validação concluída"
                    darkMode={darkMode}
                    icon={CheckCircle2}
                  />
                  <StatCard
                    title="Documentos pendentes"
                    value={documentSummary.pendente}
                    subtitle="Itens a revisar"
                    darkMode={darkMode}
                    icon={AlertCircle}
                  />
                  <StatCard
                    title="Documentos incorretos"
                    value={documentSummary.incorreto}
                    subtitle="Com justificativa"
                    darkMode={darkMode}
                    icon={XCircle}
                  />
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className={`rounded-3xl border p-6 ${panelClass}`}>
                  <SectionTitle
                    title="Panorama geral do sistema"
                    subtitle="Visão consolidada da operação e do status atual da documentação"
                  />

                  <div className="mt-5 space-y-4">
                    {[
                      [
                        "Cobertura documental",
                        `${macroSummary.completionRate}% do checklist geral está validado como correto.`,
                      ],
                      [
                        "Clientes com pendências",
                        `${macroSummary.clientsWithPending} cliente(s) ainda possuem documentos pendentes.`,
                      ],
                      [
                        "Clientes com inconsistências",
                        `${macroSummary.clientsWithIssues} cliente(s) possuem pelo menos um documento incorreto.`,
                      ],
                      [
                        "Cadastros concluídos",
                        `${macroSummary.clientsCompleted} cliente(s) estão com checklist completo e sem ressalvas.`,
                      ],
                    ].map(([title, description]) => (
                      <div
                        key={title}
                        className={`rounded-2xl border p-4 ${
                          darkMode
                            ? "border-slate-800 bg-slate-950"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <p className="font-medium">{title}</p>
                        <p className="mt-2 text-sm opacity-80">{description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className={`rounded-3xl border p-6 ${panelClass}`}>
                    <SectionTitle
                      title="Indicadores gerais"
                      subtitle="Distribuição consolidada dos cadastros e documentos"
                    />

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <StatCard
                        title="Documentos monitorados"
                        value={documentSummary.total}
                        subtitle="Itens em acompanhamento"
                        darkMode={darkMode}
                        icon={FileText}
                      />
                      <StatCard
                        title="Clientes com pendências"
                        value={macroSummary.clientsWithPending}
                        subtitle="Precisam de ação"
                        darkMode={darkMode}
                        icon={AlertCircle}
                      />
                      <StatCard
                        title="Clientes concluídos"
                        value={macroSummary.clientsCompleted}
                        subtitle="Sem pendências"
                        darkMode={darkMode}
                        icon={CheckCircle2}
                      />
                      <StatCard
                        title="Clientes com inconsistências"
                        value={macroSummary.clientsWithIssues}
                        subtitle="Exigem ajuste"
                        darkMode={darkMode}
                        icon={XCircle}
                      />
                    </div>
                  </div>

                  <div className={`rounded-3xl border p-6 ${panelClass}`}>
                    <SectionTitle
                      title="Maiores pendências"
                      subtitle="Clientes com mais itens em aberto no checklist"
                    />

                    <div className="mt-4 space-y-3">
                      {macroSummary.topPendingClients.map((client) => (
                        <div
                          key={client.id}
                          className={`rounded-2xl border p-4 ${
                            darkMode
                              ? "border-slate-800 bg-slate-950"
                              : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{client.empresa}</p>
                              <p className="mt-1 text-sm opacity-70">{client.cnpj}</p>
                            </div>
                            <div className="text-right text-sm">
                              <p>{client.pendente} pendente(s)</p>
                              <p className="opacity-70">{client.incorreto} incorreto(s)</p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {macroSummary.topPendingClients.length === 0 && (
                        <div
                          className={`rounded-2xl border p-4 text-sm opacity-75 ${
                            darkMode
                              ? "border-slate-800 bg-slate-950"
                              : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          Não há pendências abertas no momento.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                </section>
              </div>
            )}
          </div>
        </main>
      </div>

      {isImporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div
            className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${
              darkMode
                ? "border-slate-800 bg-slate-900 text-slate-100"
                : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-transparent"
                style={{ borderTopColor: BRAND.light, borderRightColor: `${BRAND.light}66` }}
              />
              <div>
                <p className="text-lg font-semibold">Carregando planilha</p>
                <p className="mt-1 text-sm opacity-70">
                  Os dados estão sendo processados e salvos no sistema.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl ${
              darkMode
                ? "border-slate-800 bg-slate-900 text-slate-100"
                : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <p className="text-lg font-semibold">Confirmar exclusão</p>
            <p className="mt-3 text-sm leading-relaxed opacity-80">
              Tem certeza de que deseja excluir o cadastro de{" "}
              <strong>{deleteCandidate.empresa}</strong>?
            </p>
            <p className="mt-3 text-sm leading-relaxed text-rose-500">
              Todos os arquivos e registros relacionados ao CNPJ{" "}
              <strong>{deleteCandidate.cnpj}</strong> também serão deletados.
            </p>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                onClick={() => setDeleteCandidate(null)}
                disabled={isDeletingClient}
                className={`rounded-2xl border px-4 py-2 text-sm font-medium ${
                  darkMode
                    ? "border-slate-700 hover:bg-slate-800"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteClient}
                disabled={isDeletingClient}
                className="rounded-2xl px-4 py-2 text-sm font-medium text-white"
                style={{
                  backgroundColor: "#E11D48",
                  opacity: isDeletingClient ? 0.7 : 1,
                  cursor: isDeletingClient ? "wait" : "pointer",
                }}
              >
                {isDeletingClient ? "Excluindo..." : "Excluir definitivamente"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {importFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${
              darkMode
                ? "border-slate-800 bg-slate-900 text-slate-100"
                : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className="mt-1 rounded-2xl p-3"
                style={{
                  backgroundColor:
                    importFeedback.type === "success" ? "#DCFCE7" : "#FFE4E6",
                }}
              >
                {importFeedback.type === "success" ? (
                  <CheckCircle2 size={22} className="text-emerald-600" />
                ) : (
                  <XCircle size={22} className="text-rose-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold">{importFeedback.title}</p>
                <p className="mt-2 text-sm opacity-75">{importFeedback.message}</p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setImportFeedback(null)}
                className="rounded-2xl px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: importFeedback.type === "success" ? BRAND.light : "#E11D48" }}
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

