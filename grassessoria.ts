import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Search, FileText, Building2, Users, Moon, Sun, Upload, CheckCircle2, XCircle, AlertCircle, Download, Filter, Menu, Trash2, Plus, Save, Eye } from "lucide-react";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

const BRAND = {
  light: "#00B3A9",
  dark: "#003650",
  white: "#F8FAFC",
  soft: "#E8F7F6",
  gray: "#E5E7EB",
  text: "#0F172A",
};

const COMPANY_DOCS = [
  "Contrato Social/Estatuto Social (Última alteração consolidada)",
  "Comprovante de endereço da empresa com vencimento em 03/2026",
  "Balanço e DRE 2023, 2024 e 2025",
  "Faturamento Contábil dos últimos 12 meses",
  "Declaração de Endividamento referente ao mês 02/2026",
  "Curva ABC de clientes referente ao mês 02/2026",
  "Borderôs de Operação de Desconto recentes",
  "Fotos da empresa",
];

const PARTNER_DOCS = [
  "Cópia RG e CPF (Emissão inferior a 10 anos)",
  "Comprovante de endereço com vencimento em 03/2026",
  "Declaração de IR 2024/2025",
  "Certidão de Casamento ou divórcio, quando aplicável",
];

const STATUS_META = {
  pendente: { label: "Pendente", color: "bg-amber-100 text-amber-800 border-amber-200", icon: AlertCircle },
  correto: { label: "Correto", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
  incorreto: { label: "Incorreto", color: "bg-rose-100 text-rose-800 border-rose-200", icon: XCircle },
};

const SAMPLE_DATA = [
  {
    id: crypto.randomUUID(),
    empresa: "Exemplo Indústria Ltda",
    cnpj: "12.345.678/0001-90",
    situacao: "ATIVA",
    porte: "Demais",
    municipio: "São Carlos",
    uf: "SP",
    telefone: "(16) 99999-9999",
    email: "contato@exemplo.com",
    atividade_principal: "Comércio varejista especializado",
    socios: ["Ana Pereira", "Carlos Souza"],
    documentos: [],
    observacoes: "Cliente com bom histórico de atendimento.",
  },
  {
    id: crypto.randomUUID(),
    empresa: "GR Soluções Comerciais ME",
    cnpj: "98.765.432/0001-10",
    situacao: "ATIVA",
    porte: "ME",
    municipio: "Rio Claro",
    uf: "SP",
    telefone: "(19) 98888-1111",
    email: "financeiro@grsolucoes.com",
    atividade_principal: "Serviços combinados de escritório",
    socios: ["Mariana Costa"],
    documentos: [],
    observacoes: "Aguardando atualização de balanço.",
  },
];

const STORAGE_KEY = "gr-assessoria-financeira-v1";

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
    id: crypto.randomUUID(),
    scope: "empresa",
    owner: record.empresa,
    name,
    files: [],
    status: "pendente",
    justification: "",
    notes: "",
    updatedAt: null,
  }));

  const partnerDocs = partnerNames.flatMap((partner) =>
    PARTNER_DOCS.map((name) => ({
      id: crypto.randomUUID(),
      scope: "socio",
      owner: partner,
      name,
      files: [],
      status: "pendente",
      justification: "",
      notes: "",
      updatedAt: null,
    }))
  );

  return [...companyDocs, ...partnerDocs];
}

function hydrateRecords(records) {
  return records.map((record) => ({
    ...record,
    documentos:
      record.documentos && record.documentos.length > 0
        ? record.documentos
        : makeRequiredDocs(record),
  }));
}

function Logo({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${compact ? "h-10 w-10" : "h-12 w-12"}`}>
        <div className="absolute inset-0 rounded-2xl" style={{ backgroundColor: BRAND.light }} />
        <div className="absolute inset-[5px] rounded-xl flex items-center justify-center font-black text-white" style={{ backgroundColor: BRAND.dark }}>
          GR
        </div>
      </div>
      {!compact && (
        <div>
          <div className="text-lg font-semibold tracking-[0.2em] uppercase">Assessoria</div>
          <div className="text-sm opacity-80 tracking-[0.35em] uppercase">Financeira</div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, subtitle, darkMode, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border p-5 shadow-sm ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm opacity-70">{title}</p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
          <p className="mt-2 text-sm opacity-70">{subtitle}</p>
        </div>
        <div className="rounded-2xl p-3" style={{ backgroundColor: `${BRAND.light}22` }}>
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
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${meta.color}`}>
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
  const [darkMode, setDarkMode] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("clientes");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [selectedId, setSelectedId] = useState(null);
  const fileInputRef = useRef(null);
  const importDocsRef = useRef(null);

  const [records, setRecords] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return hydrateRecords(SAMPLE_DATA);
    try {
      return hydrateRecords(JSON.parse(raw));
    } catch {
      return hydrateRecords(SAMPLE_DATA);
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    if (!selectedId && records.length) setSelectedId(records[0].id);
  }, [records, selectedId]);

  const selectedRecord = useMemo(
    () => records.find((item) => item.id === selectedId) || records[0],
    [records, selectedId]
  );

  const documentSummary = useMemo(() => {
    const docs = records.flatMap((r) => r.documentos || []);
    return {
      total: docs.length,
      correto: docs.filter((d) => d.status === "correto").length,
      incorreto: docs.filter((d) => d.status === "incorreto").length,
      pendente: docs.filter((d) => d.status === "pendente").length,
    };
  }, [records]);

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
      const statuses = record.documentos?.map((d) => d.status) || [];
      return statuses.includes(filterStatus);
    });
  }, [records, search, filterStatus]);

  const selectedDocs = selectedRecord?.documentos || [];

  const selectedStats = useMemo(() => {
    return {
      total: selectedDocs.length,
      correto: selectedDocs.filter((d) => d.status === "correto").length,
      incorreto: selectedDocs.filter((d) => d.status === "incorreto").length,
      pendente: selectedDocs.filter((d) => d.status === "pendente").length,
    };
  }, [selectedDocs]);

  function upsertRecord(payload) {
    setRecords((prev) => {
      const exists = prev.some((item) => item.id === payload.id);
      if (exists) {
        return prev.map((item) => (item.id === payload.id ? payload : item));
      }
      return [payload, ...prev];
    });
  }

  function updateSelected(partial) {
    if (!selectedRecord) return;
    const updated = { ...selectedRecord, ...partial };
    upsertRecord(updated);
  }

  function updateDocument(docId, partial) {
    if (!selectedRecord) return;
    const documentos = selectedRecord.documentos.map((doc) =>
      doc.id === docId ? { ...doc, ...partial, updatedAt: new Date().toISOString() } : doc
    );
    updateSelected({ documentos });
  }

  function addClient() {
    const name = prompt("Nome da empresa:");
    if (!name) return;
    const cnpj = cnpjMask(prompt("CNPJ:") || "");
    const sociosRaw = prompt("Sócios (separados por vírgula):") || "";
    const socios = sociosRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const newRecord = {
      id: crypto.randomUUID(),
      empresa: name,
      cnpj,
      situacao: "Não informada",
      porte: "Não informado",
      municipio: "",
      uf: "",
      telefone: "",
      email: "",
      atividade_principal: "",
      socios,
      observacoes: "",
      documentos: [],
    };

    const hydrated = hydrateRecords([newRecord])[0];
    setRecords((prev) => [hydrated, ...prev]);
    setSelectedId(hydrated.id);
    setActiveTab("clientes");
  }

  function removeSelected() {
    if (!selectedRecord) return;
    const ok = confirm(`Excluir ${selectedRecord.empresa}?`);
    if (!ok) return;
    setRecords((prev) => prev.filter((item) => item.id !== selectedRecord.id));
    setSelectedId(null);
  }

  async function handleSpreadsheetUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase();

    try {
      if (ext.endsWith(".csv")) {
        const text = await file.text();
        const rows = text
          .split(/
?
/)
          .map((line) => line.trim())
          .filter(Boolean);

        if (!rows.length) return;

        const delimiter = rows[0].includes(";") ? ";" : ",";
        const headers = rows[0].split(delimiter).map((h) => h.trim().toLowerCase());
        const dataRows = rows.slice(1);

        const mapped = dataRows.map((row) => {
          const cols = row.split(delimiter);
          const obj = Object.fromEntries(headers.map((h, i) => [h, cols[i] || ""]));
          return {
            id: crypto.randomUUID(),
            empresa: obj.empresa || obj["razão social"] || obj["razao social"] || "Empresa importada",
            cnpj: cnpjMask(obj.cnpj || obj["cnpj_limpo"] || ""),
            situacao: obj.situacao || obj.status || "Não informada",
            porte: obj.porte || "Não informado",
            municipio: obj.municipio || obj.cidade || "",
            uf: obj.uf || "",
            telefone: obj.telefone || "",
            email: obj.email || "",
            atividade_principal: obj.atividade_principal || obj.cnae_principal || "",
            socios: (obj.socios || obj.resumo_socios || "")
              .split(/[|,]/)
              .map((s) => s.trim())
              .filter(Boolean),
            observacoes: obj.observacoes || "",
            documentos: [],
          };
        });

        const hydrated = hydrateRecords(mapped);
        setRecords((prev) => [...hydrated, ...prev]);
        setSelectedId(hydrated[0]?.id || null);
        event.target.value = "";
        return;
      }

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      const mapped = json.map((raw) => {
        const lowered = Object.fromEntries(
          Object.entries(raw).map(([k, v]) => [String(k).trim().toLowerCase(), v])
        );

        return {
          id: crypto.randomUUID(),
          empresa:
            lowered.empresa || lowered["razão social"] || lowered["razao social"] || lowered.nome || "Empresa importada",
          cnpj: cnpjMask(lowered.cnpj || lowered["cnpj_limpo"] || lowered.documento || ""),
          situacao: lowered.situacao || lowered.status || lowered["situação"] || "Não informada",
          porte: lowered.porte || "Não informado",
          municipio: lowered.municipio || lowered.cidade || "",
          uf: lowered.uf || "",
          telefone: lowered.telefone || lowered.fone || "",
          email: lowered.email || "",
          atividade_principal: lowered.atividade_principal || lowered.cnae_principal || lowered.cnae || "",
          socios: String(lowered.socios || lowered.resumo_socios || lowered["quadro societário"] || "")
            .split(/[|,]/)
            .map((s) => s.trim())
            .filter(Boolean),
          observacoes: lowered.observacoes || lowered.observação || "",
          documentos: [],
        };
      });

      const validRows = mapped.filter((item) => item.empresa || item.cnpj);
      const hydrated = hydrateRecords(validRows);
      setRecords((prev) => [...hydrated, ...prev]);
      setSelectedId(hydrated[0]?.id || null);
      event.target.value = "";
    } catch (error) {
      console.error(error);
      alert("Não foi possível ler a planilha. Verifique se o arquivo é CSV, XLS ou XLSX e se a primeira aba contém cabeçalhos.");
    }
  }

  function handleDocumentFileUpload(docId, filesList) {
    const files = Array.from(filesList || []).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      objectUrl: URL.createObjectURL(file),
    }));

    const target = selectedDocs.find((doc) => doc.id === docId);
    if (!target) return;

    updateDocument(docId, {
      files: [...(target.files || []), ...files],
      status: target.status === "pendente" ? "correto" : target.status,
    });
  }

  function exportChecklistPdf(record) {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const marginX = 42;
    let y = 48;

    doc.setFillColor(0, 54, 80);
    doc.rect(0, 0, 595, 92, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("GR Assessoria Financeira", marginX, 38);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Resumo simplificado da documentação", marginX, 58);

    y = 120;
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
      ...record.documentos.map((d) => [
        d.name,
        d.owner,
        STATUS_META[d.status]?.label || d.status,
        d.status === "incorreto" ? d.justification || "Não informado" : d.justification || "-",
      ]),
    ];

    const widths = [220, 110, 70, 140];
    const rowHeight = 24;

    lines.forEach((row, rowIndex) => {
      if (y > 760) {
        doc.addPage();
        y = 48;
      }

      let x = marginX;
      row.forEach((cell, i) => {
        if (rowIndex === 0) {
          doc.setFillColor(0, 179, 169);
          doc.rect(x, y - 16, widths[i], rowHeight, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
        } else {
          doc.setFillColor(rowIndex % 2 === 0 ? 248 : 255, 250, 252);
          doc.rect(x, y - 16, widths[i], rowHeight, "F");
          doc.setTextColor(15, 23, 42);
          doc.setFont("helvetica", "normal");
        }
        const content = doc.splitTextToSize(String(cell || "-"), widths[i] - 8).slice(0, 2);
        doc.text(content, x + 4, y);
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
    <div className={`h-full border-r ${panelClass} ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
      <div className="flex items-center justify-between px-5 py-5">
        <Logo compact={false} />
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={addClient}
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
          { key: "documentos", label: "Documentação", icon: FileText },
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

      <div className="mt-6 px-4">
        <div className={`rounded-3xl border p-4 ${panelClass}`}>
          <p className="text-sm opacity-70">Tema</p>
          <div className="mt-3 flex items-center justify-between rounded-2xl border px-3 py-2" style={{ borderColor: `${BRAND.light}55` }}>
            <span className="text-sm">Modo noturno</span>
            <button
              onClick={() => setDarkMode((v) => !v)}
              className="rounded-full p-2"
              style={{ backgroundColor: `${BRAND.light}22` }}
            >
              {darkMode ? <Moon size={16} style={{ color: BRAND.light }} /> : <Sun size={16} style={{ color: BRAND.dark }} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${shellClasses}`}>
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[300px_1fr]">
        <div className="hidden lg:block">{sideNav}</div>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 grid grid-cols-[280px_1fr] lg:hidden">
            <div className="z-50">{sideNav}</div>
            <button className="bg-black/40" onClick={() => setMobileOpen(false)} />
          </div>
        )}

        <main className="min-w-0">
          <header className={`sticky top-0 z-30 border-b backdrop-blur ${darkMode ? "bg-slate-950/85 border-slate-800" : "bg-slate-50/85 border-slate-200"}`}>
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
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-white"
                  style={{ backgroundColor: BRAND.dark }}
                >
                  Importar planilha
                </button>
                <input ref={fileInputRef} type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={handleSpreadsheetUpload} />
              </div>
            </div>
          </header>

          <div className="space-y-6 px-4 py-5 md:px-6 md:py-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Empresas" value={records.length} subtitle="Base cadastrada" darkMode={darkMode} icon={Building2} />
              <StatCard title="Documentos corretos" value={documentSummary.correto} subtitle="Validação concluída" darkMode={darkMode} icon={CheckCircle2} />
              <StatCard title="Documentos pendentes" value={documentSummary.pendente} subtitle="Itens a revisar" darkMode={darkMode} icon={AlertCircle} />
              <StatCard title="Documentos incorretos" value={documentSummary.incorreto} subtitle="Com justificativa" darkMode={darkMode} icon={XCircle} />
            </section>

            {activeTab === "clientes" && (
              <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
                <div className={`rounded-3xl border ${panelClass}`}>
                  <div className="border-b px-5 py-4" style={{ borderColor: darkMode ? "#1E293B" : "#E2E8F0" }}>
                    <SectionTitle title="Empresas" subtitle="Selecione um cliente para ver mais detalhes" />
                  </div>
                  <div className="max-h-[70vh] overflow-auto p-3">
                    <div className="space-y-3">
                      {filteredRecords.map((record) => {
                        const active = selectedId === record.id;
                        const pendentes = record.documentos.filter((d) => d.status === "pendente").length;
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
                            style={active ? { borderColor: BRAND.light, backgroundColor: `${BRAND.light}15` } : {}}
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
                            <Pill status={selectedRecord.situacao?.toLowerCase() === "ativa" ? "correto" : "pendente"} />
                            <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: `${BRAND.light}22`, color: BRAND.light }}>
                              {selectedRecord.porte || "Porte não informado"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => exportChecklistPdf(selectedRecord)}
                            className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white"
                            style={{ backgroundColor: BRAND.light }}
                          >
                            <Download size={16} />
                            Baixar PDF
                          </button>
                          <button
                            onClick={removeSelected}
                            className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${panelClass}`}
                          >
                            <Trash2 size={16} />
                            Excluir
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
                          <div key={label} className={`rounded-2xl border p-4 ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
                            <p className="text-sm opacity-70">{label}</p>
                            <p className="mt-2 text-sm font-medium leading-relaxed">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={`rounded-3xl border p-6 ${panelClass}`}>
                      <SectionTitle title="Anotações internas" subtitle="Observações gerais do atendimento" />
                      <textarea
                        value={selectedRecord.observacoes || ""}
                        onChange={(e) => updateSelected({ observacoes: e.target.value })}
                        rows={6}
                        placeholder="Escreva observações, pendências, contexto comercial e próximos passos..."
                        className={`mt-4 w-full rounded-2xl border p-4 outline-none ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"}`}
                      />
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeTab === "documentos" && selectedRecord && (
              <section className="space-y-6">
                <div className={`rounded-3xl border p-6 ${panelClass}`}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <SectionTitle title="Documentação do cliente" subtitle={`${selectedRecord.empresa} • ${selectedRecord.cnpj}`} />
                    <button
                      onClick={() => exportChecklistPdf(selectedRecord)}
                      className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white"
                      style={{ backgroundColor: BRAND.dark }}
                    >
                      <Download size={16} />
                      Exportar checklist
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard title="Total" value={selectedStats.total} subtitle="Itens monitorados" darkMode={darkMode} icon={FileText} />
                    <StatCard title="Corretos" value={selectedStats.correto} subtitle="Aprovados" darkMode={darkMode} icon={CheckCircle2} />
                    <StatCard title="Pendentes" value={selectedStats.pendente} subtitle="Aguardando envio" darkMode={darkMode} icon={AlertCircle} />
                    <StatCard title="Incorretos" value={selectedStats.incorreto} subtitle="Precisam ajuste" darkMode={darkMode} icon={XCircle} />
                  </div>
                </div>

                <div className="grid gap-4">
                  {selectedDocs.map((docItem) => (
                    <motion.div
                      key={docItem.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-3xl border p-5 ${panelClass}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-semibold leading-tight">{docItem.name}</h3>
                            <Pill status={docItem.status} />
                          </div>
                          <p className="mt-2 text-sm opacity-70">
                            {docItem.scope === "empresa" ? "Documento PJ" : "Documento do sócio"} • Responsável: {docItem.owner}
                          </p>
                        </div>

                        <label
                          className="flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white"
                          style={{ backgroundColor: BRAND.light }}
                        >
                          <Upload size={16} />
                          Inserir documento
                          <input
                            type="file"
                            className="hidden"
                            multiple
                            onChange={(e) => handleDocumentFileUpload(docItem.id, e.target.files)}
                          />
                        </label>
                      </div>

                      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px]">
                        <div className="space-y-4">
                          <div>
                            <p className="mb-2 text-sm font-medium">Arquivos enviados</p>
                            {(docItem.files || []).length === 0 ? (
                              <div className={`rounded-2xl border border-dashed p-4 text-sm opacity-70 ${darkMode ? "border-slate-700 bg-slate-950" : "border-slate-300 bg-slate-50"}`}>
                                Nenhum arquivo inserido até o momento.
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {docItem.files.map((f) => (
                                  <div
                                    key={f.id}
                                    className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"}`}
                                  >
                                    <div>
                                      <p className="text-sm font-medium">{f.name}</p>
                                      <p className="text-xs opacity-70">
                                        {Math.max(1, Math.round((f.size || 0) / 1024))} KB • {new Date(f.uploadedAt).toLocaleString("pt-BR")}
                                      </p>
                                    </div>
                                    {f.objectUrl && (
                                      <a
                                        href={f.objectUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm font-medium"
                                        style={{ color: BRAND.light }}
                                      >
                                        Visualizar
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="mb-2 text-sm font-medium">Justificativa rápida</p>
                            <textarea
                              value={docItem.justification || ""}
                              onChange={(e) => updateDocument(docItem.id, { justification: e.target.value })}
                              rows={3}
                              placeholder="Ex.: comprovante vencido, documento ilegível, ausência de assinatura..."
                              className={`w-full rounded-2xl border p-4 outline-none ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"}`}
                            />
                          </div>
                        </div>

                        <div className={`rounded-2xl border p-4 ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
                          <p className="text-sm font-medium">Validação</p>
                          <div className="mt-3 space-y-2">
                            {Object.entries(STATUS_META).map(([key, meta]) => (
                              <button
                                key={key}
                                onClick={() => updateDocument(docItem.id, { status: key })}
                                className={`w-full rounded-2xl border px-3 py-3 text-left text-sm ${docItem.status === key ? meta.color : darkMode ? "border-slate-800 hover:bg-slate-900" : "border-slate-200 hover:bg-white"}`}
                              >
                                {meta.label}
                              </button>
                            ))}
                          </div>

                          <p className="mt-4 text-sm font-medium">Notas internas</p>
                          <textarea
                            value={docItem.notes || ""}
                            onChange={(e) => updateDocument(docItem.id, { notes: e.target.value })}
                            rows={5}
                            placeholder="Critérios de validação, alinhamento com cliente, retorno do analista..."
                            className={`mt-2 w-full rounded-2xl border p-3 text-sm outline-none ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === "resumo" && selectedRecord && (
              <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className={`rounded-3xl border p-6 ${panelClass}`}>
                  <SectionTitle title="Resumo para envio ao cliente" subtitle="Visão simplificada do que falta, do que está correto e do que precisa ajuste" />
                  <div className="mt-5 overflow-hidden rounded-3xl border" style={{ borderColor: darkMode ? "#1E293B" : "#E2E8F0" }}>
                    <div className="grid grid-cols-[1.4fr_1fr_0.7fr_1.2fr] text-sm font-medium text-white" style={{ backgroundColor: BRAND.dark }}>
                      <div className="px-4 py-3">Documento</div>
                      <div className="px-4 py-3">Responsável</div>
                      <div className="px-4 py-3">Status</div>
                      <div className="px-4 py-3">Observação</div>
                    </div>
                    <div>
                      {selectedDocs.map((d, idx) => (
                        <div
                          key={d.id}
                          className={`grid grid-cols-[1.4fr_1fr_0.7fr_1.2fr] text-sm ${
                            idx % 2 === 0 ? (darkMode ? "bg-slate-950" : "bg-slate-50") : ""
                          }`}
                        >
                          <div className="px-4 py-3">{d.name}</div>
                          <div className="px-4 py-3">{d.owner}</div>
                          <div className="px-4 py-3">{STATUS_META[d.status]?.label}</div>
                          <div className="px-4 py-3">{d.status === "incorreto" ? d.justification || "Ajuste necessário" : d.justification || "-"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`rounded-3xl border p-6 ${panelClass}`}>
                  <SectionTitle title="Ações rápidas" subtitle="Salve localmente e compartilhe o PDF com o cliente" />
                  <div className="mt-5 space-y-3">
                    <button
                      onClick={() => exportChecklistPdf(selectedRecord)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-white"
                      style={{ backgroundColor: BRAND.light }}
                    >
                      <Download size={18} />
                      Gerar PDF simplificado
                    </button>
                    <button
                      onClick={() => localStorage.setItem(STORAGE_KEY, JSON.stringify(records))}
                      className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-4 ${panelClass}`}
                    >
                      <Save size={18} />
                      Salvar dados localmente
                    </button>
                  </div>

                  <div className={`mt-5 rounded-3xl border p-4 ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
                    <p className="font-medium">Próximas evoluções sugeridas</p>
                    <ul className="mt-3 space-y-2 text-sm opacity-80">
                      <li>• Integração direta com sua planilha enriquecida em Excel</li>
                      <li>• Login de usuários e níveis de acesso</li>
                      <li>• OCR e leitura automática de vencimento e assinatura</li>
                      <li>• Banco de dados em nuvem para equipe</li>
                      <li>• Versão empacotada para desktop e mobile</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
