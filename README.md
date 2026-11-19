# DocuSmart AI — Intelligent Document Processing for Small Businesses

> A modern, high-performance SaaS frontend for Intelligent Document Processing (IDP). Automatically extract, validate, manage, and audit invoices, receipts, and commercial documents with AI precision.

---

## 🚀 Live Application

- **Local Development URL**: [http://localhost:3000](http://localhost:3000)
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript (Strict)
- **Styling**: Tailwind CSS (Dark Navy SaaS Design System)
- **Icons**: Lucide React
- **AI Engine**: Google Gemini 2.0 Flash / Gemini 1.5 Pro (Multimodal)

---

## 🎨 Design System

DocuSmart AI utilizes a bespoke, accessibility-conscious dark navy theme crafted specifically for financial & document management SaaS applications:

- **Background Canvas**: Deep Space Navy (`#04071a`)
- **Card & Sidebar Elevation**: Midnight Navy (`#080d2a`, `#0d1240`)
- **Primary Accents**: Electric Cobalt (`#3b82f6`) & Vivid Purple (`#8b5cf6`)
- **Status Semantic Palette**:
  - Processed: Emerald (`#10b981`)
  - In Review: Cobalt Blue (`#3b82f6`)
  - Pending: Amber (`#f59e0b`)
  - Rejected: Crimson (`#ef4444`)
  - Duplicate: Tangerine (`#f97316`)
- **Glassmorphism**: Subtle translucent white borders (`border-white/5` to `border-white/10`) with `backdrop-blur-md` surfaces.

---

## 📑 Pages & Core Modules

### 1. 📊 Dashboard
- **Executive KPI Cards**: Total processed invoices, successful extractions (with weekly trend % indicators), pending reviews count, and duplicate flags.
- **Weekly Processing Bar Chart**: Interactive stacked SVG chart tracking daily throughput (processed vs. failed) with weekday tooltips.
- **Real-Time Activity Feed**: Live audit stream tracking processing events, approvals, and flagged anomalies with relative timestamps.
- **Recent Invoices**: Quick preview of the latest 5 documents with instant inspection links into the detail view.
- **Top Action Bar**: Quick buttons for `+ Quick Entry` (manual invoice creation) and `Upload Scans`.

### 2. 📤 Upload Documents
- **Drag-and-Drop Dropzone**: Native file picker supporting PDF, JPG, and PNG documents up to 50MB.
- **One-Click Sample Invoices Bar**: Instant test invoices (`SaaS License PDF`, `Freight Invoice PDF`, `Receipt Scan PNG`) to test complete processing without needing local files.
- **Animated Progress Bars**: Real-time percentage simulation tracking staging, validation, and completion.
- **Document Preview Modal**: Interactive modal rendering live image zooms, embedded native PDF viewer, and Gemini multimodal readiness indicators.
- **Auto-Registration & Persistence**: Completed uploads seamlessly populate the live document library and persist in `localStorage`.
- **Upload Queue Actions**: Direct preview (eye icon) and remove (trash icon) controls per staged file.

### 3. 📁 All Documents
- **Real-time Filter & Search**: Debounced search by vendor name, invoice number, or filename.
- **Clickable Status Chips**: Filter pills with live document counts (`All`, `Processed`, `Pending`, `Review`, `Rejected`, `Duplicate`).
- **Table Density Toggle**: 1-click switcher between `Comfortable` (56px) and `Compact` (44px) row spacing for high-volume invoice scanning.
- **Multi-Dimensional Advanced Filters**: Expandable filter drawer with Vendor dropdown, Category dropdown, Amount Range ($) Min/Max inputs, and Start/End Date Range pickers.
- **Interactive Active Filter Tags Bar**: Real-time dismissible tags showing active filters (query, status, confidence, vendor, category, amounts, dates) with 1-click `Clear All` reset.
- **Batch Multi-Select & Floating Actions Dock**:
  - Master checkbox to select all filtered documents or pick individual rows.
  - **Bulk Category Tagging**: Assign accounting expense categories (`Software & SaaS`, `Marketing & Ads`, `Logistics & Shipping`, `Legal & Professional`, `Office Supplies`, `Utilities & Telecom`) to multiple invoices simultaneously.
  - Floating bottom dock with `Batch Approve`, `QuickBooks`, `Xero (CSV)`, and `Export Selected` CSV.
- **Multi-Column Sorting**: Sort by Upload Date, Vendor, Amount, and Confidence score.
- **Accounting Exports**: 1-click accounting-ready exports formatted for QuickBooks and Xero.
- **Duplicate Invoice Reconciliation**:
  - Automated duplicate detection alerting reviewers when an incoming invoice matches an existing record.
  - **"Compare with Original" Modal**: Side-by-side reconciliation viewer comparing the current upload against the recorded invoice to prevent duplicate payments.
- **Slide-out Detail Drawer**:
  - Full extracted metadata and line items breakdown.
  - **Inline Category Assignment**: Quick selector to tag or update the invoice's accounting expense category.
  - **Re-run Gemini AI Extraction**: 1-click re-extraction trigger with animated spinner, 99% confidence score recalculation, and audit trail update.
  - **Audit Trail Timeline**: Step-by-step chronology (Document Ingestion, Gemini Multimodal OCR, Current Status).
  - Severity-based validation warnings (high, medium, low).
  - **Print Slip Action**: Opens an enterprise-grade printable invoice processing voucher with `window.print()` trigger.
  - 1-Click `Export JSON` for structured document data.
  - `Delete Document` with confirmation dialog and toast notification.
  - `Review Document` shortcut directly linking to the Review & Validation queue.

### 4. 📑 Review & Validation
- **Document Review Queue**: Selectable list of all documents awaiting human-in-the-loop validation with confidence scores.
- **Focus / Full Screen Toggle**: 1-click collapse of the review queue to give the validation workspace full viewport width.
- **Three-Way Inspection Modes**:
  - **Form Fields Editor**: 11 reactive, editable inputs (Vendor, Address, Invoice #, Dates, Line Items, Subtotal, Tax, Total, PO #).
  - **Split View (Side-by-Side)**: Enterprise dual-column layout displaying editable fields alongside the visual document simultaneously.
  - **Visual Document Layout**: Rendered digital invoice sheet displaying glowing neon AI bounding boxes (`[VENDOR]`, `[INVOICE META]`, `[TOTAL AMOUNT]`, and extracted line item tables).
- **Interactive HITL Cross-Highlighting**: Focusing any form field (`Vendor`, `Invoice #`, `Total Due`, or `Line Items`) triggers a glowing ring and scale effect on the matching bounding box in the digital document.
- **Interactive Line Items Editor**: Add, edit (description, quantity, unit price), or remove line items with automatic line total computation.
- **Dynamic Math Recalculation**: `Sum to Subtotal` button automatically updates subtotal and total based on line items.
- **Real-Time Arithmetic Mismatch Alert**: Alerts reviewers when `Subtotal + Tax ≠ Total` with a single-click sync button.
- **Keyboard Shortcuts**:
  - `[A]` to immediately approve the active invoice.
  - `[↑ / ↓]` to navigate through documents in the queue.
- **Approval Workflow**: **Approve** (marks processed) and **Reject** (with required rejection reason modal).

### 5. 📈 Analytics
- **Dynamic Timeframe Selector**: Toggle between `Last 7 Days`, `Last 30 Days`, `This Quarter`, and `Year to Date (2024)` with instant metric recalculation.
- **Financial & Operational KPIs**: Total spend processed, average confidence score, 2.4s average extraction time, and volume projections.
- **Dynamic Vendor Spend Breakdown**: Real-time spending aggregation calculated from active document library with relative volume bars.
- **Expense Category Breakdown**: Dedicated spend distribution card displaying spend across accounting categories (`Software & SaaS`, `Marketing & Ads`, `Legal & Professional`, `Office Supplies`, `Logistics & Shipping`, `Utilities & Telecom`) with custom colored gradients, spend totals, document counts, and percentage allocations.
- **Status Distribution & Accuracy Trends**: Verification pipeline state bars alongside 7-point confidence curve with area gradient fill.
- **Interactive Vendor Profile & Accounting Ledger**:
  - Clicking any vendor opens a profile modal displaying total spend, invoice count, average confidence, address on file, and an itemized **Invoices on Record** table.
  - **Export Vendor Ledger**: 1-click export of vendor-specific reconciliation statements in CSV format.
- **Executive Report Export**: 1-click `Export Report` action generating an executive financial intelligence summary in structured JSON format including vendor and category breakdowns.

### 6. ⚙️ Settings
- **General Tab**:
  - Company profile, base currency (`USD`, `EUR`, `GBP`, `AUD`), timezone, and language.
  - **Data Portability & System Backups Hub**:
    - **Export System Backup (JSON)**: 1-click download of all invoices, extraction fields, line items, and audit trails as a portable JSON snapshot.
    - **Restore from Backup (JSON)**: Direct JSON file uploader that validates backup schemas, loads invoice collections into local storage, and provides visual confirmation feedback.
    - **Reset Document Database**: 1-click button to reset storage back to clean sample data.
- **Notifications Tab**: Email/Slack switches, processing triggers, and duplicate alerts.
- **Integrations Tab**:
  - **Google Gemini 2.0 AI Engine Card**: In-browser API key management with show/hide toggle, model selection (`gemini-2.0-flash` / `gemini-1.5-pro`), and **"Test Connection"** verification button.
  - API key management (show/hide, copy to clipboard, and instant key regeneration).
  - Webhook configuration.
  - One-click accounting connectors (QuickBooks, Xero, Sage).
- **Workflow Rules Tab**:
  - **Intelligent Workflow Rules Engine**: 5 pre-configured automation rules (Low-risk auto-approve, High-value controller escalation, Duplicate invoice auto-block, Arithmetic discrepancy gate, and Urgent payment terms alert).
  - **Rules Simulation Engine**: Real-time evaluation running rules against the current document library to forecast automation coverage.
  - **Custom Rule Creator**: Form to define custom rule names, trigger condition expressions, and target actions (`Auto-Approve`, `Flag for Review`, `Reject & Halt`, `Send Alert`).
- **Security Tab**: Password change validator, Two-Factor Authentication (2FA) toggle, and active session manager with per-device revocation.

### 🌐 Global Shell & Productivity
- **Global Quick Search**: Press `Ctrl+K` (or `⌘K`) anywhere to open the command palette and jump to any document.
- **Keyboard Shortcuts Guide**: Press `?` (or click the Topbar `?` icon) to view the global shortcuts modal.
- **Number Key Navigation**: Press `1` – `6` outside inputs to switch views instantly.
- **Notifications Dropdown**: Real-time notification feed with unread count badge and `Mark all read` action.
- **User Profile Menu**: Administrator profile card with Pro tier active badge and shortcut links.
- **Global Toast Notification Dock**: Floating bottom-right notifications for approvals, rejections, manual additions, and deletions.
- **Client Storage Persistence**: Full hydration-safe `localStorage` synchronization for documents, approvals, and AI configurations.

---

## ⌨️ Keyboard Shortcuts Reference

| Shortcut | Action | Scope |
|---|---|---|
| `Ctrl + K` / `Cmd + K` | Open Quick Search Command Palette | Global |
| `?` | Open Keyboard Shortcuts Guide | Global |
| `1` – `6` | Instant View Switching (Dashboard, Upload, Documents, Review, Analytics, Settings) | Global |
| `Esc` | Close Modal / Search / Drawer / Dropdown | Global |
| `A` | Approve Active Invoice | Review & Validation |
| `↑` / `↓` | Navigate to Previous / Next Invoice | Review & Validation |

---

## ⚡ Connecting Google Gemini API

DocuSmart AI includes prepared schema definitions, prompt templates, and an App Router API handler ready for multimodal document extraction with Gemini 2.0 / 1.5.

### Option A: Via Settings in the App (No Restart Needed)
1. Navigate to **Settings** > **Integrations**.
2. Paste your Gemini API key in the **Google Gemini 2.0 AI Engine** card.
3. Select your model (`Gemini 2.0 Flash` or `Gemini 1.5 Pro`).
4. Click **"Save Gemini Config"** and **"Test Connection"**.
5. Uploaded files will immediately use real multimodal Gemini vision processing!

### Option B: Via Environment File
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Add your Gemini API key from [Google AI Studio](https://aistudio.google.com/):
   ```env
   GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
   ```
3. The extraction route is available at `POST /api/extract`.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ (Node.js 20+ LTS recommended)
- npm or pnpm

### Installation
```bash
# Clone or navigate to the directory
cd DocuSmart-AI

# Install dependencies
npm install

# Start the Next.js development server
npm run dev

# Or create an optimized production build
npm run build
npm start
```

Visit [http://localhost:3000](http://localhost:3000) to access the application.

---

## 📂 Project Architecture

```
DocuSmart-AI/
├── app/
│   ├── api/
│   │   └── extract/
│   │       └── route.ts         # Multimodal Gemini extraction API handler
│   ├── globals.css              # Custom Tailwind utilities & glassmorphism classes
│   ├── layout.tsx               # Root application layout & metadata
│   ├── page.tsx                 # Core client shell, reactive state & routing
│   └── views/
│       ├── AnalyticsPage.tsx    # KPIs, volume & accuracy charts, timeframe filters
│       ├── DashboardPage.tsx    # Summary metrics, SVG chart, activity stream
│       ├── DocumentsPage.tsx    # Filterable data table, batch actions, audit trail & printable voucher
│       ├── ReviewPage.tsx       # Dual-mode validation queue & keyboard shortcuts
│       ├── SettingsPage.tsx     # 4-tab configuration, Gemini AI engine & integration panel
│       └── UploadPage.tsx       # Dropzone, sample invoice chips, progress simulation & embedded reader
├── components/
│   ├── ActivityFeed.tsx         # Event timeline component
│   ├── DocumentTable.tsx        # Multi-select sortable table with confidence colors
│   ├── NewDocumentModal.tsx     # Manual invoice entry modal with validation
│   ├── Sidebar.tsx              # Responsive in-flow desktop sidebar / mobile drawer
│   ├── StatCard.tsx             # Glassmorphism metric KPI cards
│   ├── StatusBadge.tsx          # Semantic status badge component
│   ├── Toast.tsx                # Floating notification dock
│   ├── Topbar.tsx               # Header with Ctrl+K search, shortcuts guide, notifications & profile
│   ├── UploadQueue.tsx          # Upload queue item rows with preview/remove
│   ├── UploadZone.tsx           # Drag-and-drop file upload zone
│   └── ValidationPanel.tsx      # Dual-mode inspection panel with bounding boxes & line items editor
├── lib/
│   ├── data.ts                  # Realistic sample invoices, vendors & chart records
│   ├── gemini.ts                # Gemini multimodal prompt, schema & REST client
│   ├── types.ts                 # Full TypeScript interfaces for IDP models
│   └── utils.ts                 # Formatting helpers for currency, dates, and sizes
├── .env.example                 # Environment configuration template
├── next.config.js               # Next.js configuration
├── package.json                 # Project dependencies & scripts
├── tailwind.config.ts           # Custom Tailwind color palette & keyframe animations
└── tsconfig.json                # TypeScript strict configuration
```

---

## 📄 License
This project is proprietary and built for small businesses seeking intelligent document processing.