# GR Assessoria — CRM

Aplicação desktop de CRM (Customer Relationship Management) desenvolvida para apoiar a operação da **GR Assessoria Financeira**, com foco na gestão de relacionamento com clientes e processos ligados a **FIDCs (Fundos de Investimento em Direitos Creditórios)**.

O sistema roda como aplicativo desktop (via Electron) com interface web em React, permitindo uso local com banco de dados SQLite, geração de relatórios em PDF e importação/exportação de planilhas.

## ✨ Funcionalidades

- Gestão de relacionamento com clientes (CRM) voltada à assessoria financeira
- Importação e manipulação de dados em planilhas Excel (`.xlsx`)
- Geração de documentos e relatórios em PDF
- Interface desktop nativa via Electron, com build web baseado em Vite + React
- Persistência local de dados via SQLite

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Interface | React 18 + Tailwind CSS 4 |
| Build/Dev Server | Vite 5 |
| Desktop | Electron 37 |
| Banco de dados | SQLite3 |
| Geração de PDF | jsPDF |
| Planilhas | SheetJS (xlsx) |
| Animações | Framer Motion |
| Ícones | Lucide React |

## 📁 Estrutura do Projeto

```
crm_gr/
├── electron/         # Processo principal do Electron (main.cjs)
├── public/           # Arquivos estáticos
├── src/              # Código-fonte da aplicação React
├── index.html        # HTML de entrada da aplicação web
├── grassessoria.ts   # Módulo/lógica específica da GR Assessoria
├── vite.config.js    # Configuração do Vite
└── package.json      # Dependências e scripts do projeto
```

## 🚀 Como Executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- npm

### Instalação

```bash
git clone https://github.com/gpedrosouza/crm_gr.git
cd crm_gr
npm install
```

### Executando em modo desenvolvimento (web)

```bash
npm run dev
```

Abre a aplicação em `http://localhost:5173`.

### Executando como aplicativo desktop (Electron)

```bash
npm run dev:desktop
```

Sobe o servidor Vite e abre a janela do Electron automaticamente, aguardando o servidor ficar disponível.

### Build de produção

```bash
npm run build
```

### Executando o app Electron a partir do build

```bash
npm run electron
```

## 📦 Scripts Disponíveis

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento Vite |
| `npm run build` | Gera o build de produção |
| `npm run preview` | Pré-visualiza o build de produção |
| `npm run electron` | Executa o aplicativo Electron |
| `npm run dev:desktop` | Roda Vite + Electron simultaneamente em modo desenvolvimento |

## 📄 Licença

Este projeto está licenciado sob os termos descritos no arquivo [LICENSE](./LICENSE).

## 👤 Autor

Desenvolvido por [Guilherme Pedro Souza](https://github.com/gpedrosouza).
