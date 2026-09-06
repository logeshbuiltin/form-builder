# Healthcare Template & Document Platform — Comprehensive Architecture Audit

**Phase 0 Deliverable**  
**Repository**: `lths-form-builder`  
**Date**: September 2026  
**Status**: Completed  

---

## 1. Executive Summary

This architecture audit is the initial milestone (Phase 0) for transforming the existing GrapeJS-based form/template builder into an enterprise-grade, multi-tenant, healthcare-focused document and template platform. 

The current application is a client-side Single Page Application (SPA) built with Angular 14, PrimeNG 14, and GrapesJS 0.22.5. Historically, it operated as a frontend console for an external healthcare HIS/EMR backend system (`mykarecloud360-dev.hatiintl.com.my`). In recent iterations, it has been enhanced with localized multi-language support (English/German), an offline-first template store, variable rendering, clinical patient context mocking, and interactive multi-document format blocks.

This document details the existing architecture, technology stack, directory layout, core subsystems, technical debt, security posture, and actionable architectural recommendations to guide subsequent phases (Phase 1 through Phase 25).

---

## 2. Technology Stack

| Layer / Aspect | Technology / Library | Version | Notes & Status |
| :--- | :--- | :--- | :--- |
| **Framework** | Angular | `~14.2.1` | Multi-project workspace structure (`projects/form-builder`) |
| **Language** | TypeScript | `~4.7.2` | Strict typing partially adopted; target ES2020 |
| **UI Component Library**| PrimeNG | `14.0.0` | Comprehensive component suite (Dialog, Dropdown, Toast, Table, Toolbar) |
| **CSS Utility / Icons** | PrimeFlex, PrimeIcons, FontAwesome | `3.2.0` / `5.0.0` / `4.4 & 6.1` | Mixed styling approaches (PrimeFlex + SASS + CDN FontAwesome) |
| **Visual Editor Core** | GrapesJS | `0.22.5` | Installed via npm, but also referenced via `unpkg.com` in `index.html` |
| **GrapesJS Plugins** | `grapesjs-preset-webpage`<br>`grapesjs-plugin-forms`<br>`grapesjs-script-editor`<br>`grapesjs-component-code-editor`<br>`grapesjs-blocks-basic`<br>`grapesjs-blocks-table` | Various | Rich drag-and-drop page and form editing capabilities |
| **State & Async** | RxJS | `~7.5.0` | Reactive streams; some older services use callback antipatterns |
| **Internationalization**| `@ngx-translate/core`, `@ngx-translate/http-loader` | `^14.0.0` | Configured for dynamic JSON loading (`en.json`, `de.json`, `English.json`, `German.json`) |
| **Auth & Cookies** | `ngx-cookie-service` | `^14.0.1` | Cookie parsing for base64-encoded bearer tokens |
| **Containerization** | Docker + NGINX + `svc-env` | Alpine / Nginx | Multi-stage build with runtime env injection via `assets/env.js` |
| **Testing** | Karma + Jasmine | `~6.4.0` / `~4.3.0` | Minimal boilerplate tests; currently missing mock providers |

---

## 3. Directory & Folder Structure

```
form_builder/
├── angular.json                           # Angular CLI multi-project workspace configuration
├── package.json / package-lock.json       # Project dependencies and npm scripts
├── tsconfig.json                          # TypeScript configuration
├── Dockerfile                             # Multi-stage production container build
├── nginx.conf                             # Production Nginx reverse proxy configuration
├── proxy.conf.json / proxy.conf.dev.json  # Dev proxy configs (previously mapped to external EMR)
├── svc-env/ & svc-nginx/                  # Container startup and runtime env replacement scripts
├── docs/                                  # Architectural documentation and audits (NEW)
└── projects/
    └── form-builder/                      # Primary application project
        ├── src/
        │   ├── index.html                 # Main HTML shell, loads fonts and GrapesJS CDN bundles
        │   ├── styles.scss                # Global styles and theme overrides
        │   ├── environments/              # Angular environment manifests (dev, prod, default)
        │   ├── assets/
        │   │   ├── env.js / env.js.template # Dynamic runtime environment configuration
        │   │   ├── i18n/                  # Translation dictionaries (English, German, Hindi, etc.)
        │   │   ├── theme/ & layout/       # PrimeNG Medcare themes and layout stylesheets
        │   │   └── demo/data/             # Mock datasets (emr-component.json)
        │   └── app/
        │       ├── app.module.ts          # Root module (imports Core, PrimeNG, TranslateModule)
        │       ├── app-routing.module.ts  # Root router (redirects to /home lazy route)
        │       ├── common/                # Utility helpers, constants, and enums
        │       │   ├── app-utils.ts       # Toast, validation, and object manipulation helpers
        │       │   ├── constant/          # System master and cookie constants
        │       │   └── enum/              # Component types, editor sources, event actions
        │       ├── constants/             # AppGlobalConstant (API endpoints, route keys)
        │       ├── guard/                 # Route guards (AuthGuardService)
        │       ├── http/                  # HTTP client, interceptors, and callback contracts
        │       │   ├── lz-api.service.ts  # Legacy HTTP abstraction layer
        │       │   ├── interceptor/       # TokenInterceptor (adds Bearer token from cookies)
        │       │   └── callback/          # ApiCallBack interface (onResult, onError)
        │       ├── data/                  # Domain services, data models, and block definitions
        │       │   ├── model/             # TypeScript models (template, forms, clinical, master)
        │       │   ├── constant/          # Document format presets (12 business/clinical layouts)
        │       │   ├── service/           # Core services (GrapeEditor, EditorBlockManager, etc.)
        │       │   └── settings-data.ts   # In-memory storage bean for forms and UI state
        │       └── modules/
        │           └── form-builder/      # Main feature module
        │               ├── form-builder/  # Visual designer (canvas, panels, modals, toolbars)
        │               └── form-view/     # Preview and iframe printing component
```

---

## 4. Frontend Architecture & State Management

### 4.1 Routing & Navigation
The application employs Angular lazy-loading:
- **`''` (Root)**: Redirects to `/home`.
- **`home`**: Dynamically loads `FormBuilderModule`.
- **`home/form-builder`**: The primary editor view hosting GrapesJS, top toolbars, category selectors, AI search, template gallery, and drawer panels.
- **`home/form-view`**: The standalone preview and print view, rendering the compiled HTML/CSS inside an isolated `<iframe>` to prevent CSS bleed.

### 4.2 State Management
State is managed across three tiers:
1. **Component-Level State**: Active category, search terms, modal visibility flags, and form groups (`patientContextForm`, `demographicForm`, `customLayoutForm`) in `FormBuilderComponent`.
2. **Service Singletons**:
   - `SettingsData`: In-memory cache for loaded forms, active templates, and EMR components.
   - `TemplateStoreService`: LocalStorage persistence layer (`form_builder_generic_templates_v1`) holding custom and generic templates.
   - `ClinicalWorkflowService`: LocalStorage adapter (`form_builder_clinical_context_v1`, `form_builder_clinical_audit_v1`) managing mock patient encounters and audit trails.
3. **Session State**: `sessionStorage.getItem('form_builder_preview_form')` transfers compiled document HTML, CSS, and JS between the editor and the previewer routes.

---

## 5. GrapeJS Integration Architecture

### 5.1 Initialization (`GrapeEditorService`)
- The visual canvas is bound to `#gjs`.
- GrapesJS configuration disables default local/remote auto-saving (`autosave: false`, `autoload: false`) to avoid blocking network I/O.
- Plugin suite includes basic layout blocks, forms plugin, code editor, table builder, and webpage presets.
- External canvas stylesheets are injected dynamically (Bootstrap 4, FontAwesome 4 & 6) into the editor's iframe canvas.

### 5.2 Block Manager Architecture (`EditorBlockManagerService`)
Blocks are registered programmatically in distinct categories:
- **Demographics**: Unified clinical demographic attributes (Patient Name, MRN, Age, Gender, DOB, Blood Group, Contact, Vitals, Address) plus a dynamic `+ Add Field` block that launches a customization modal.
- **Document Studio Templates (Ready Templates)**: 12 pre-designed business and clinical formats (Medical Consultation Report, Patient Intake, Invoices, Financial P&L, HR Contracts, Certificates, Delivery Notes, Restaurant Menus). Filterable by top-level Category dropdown.
- **Custom Forms & Layouts**: User-created layouts stored in `localStorage` or retrieved from EMR endpoints.
- **Units of Measure (UOM)**: Clinical measurement units (blood pressure, temperature, weight, glucose).
- **Data Binding Blocks**: Variable tags such as `{{patient.name}}`, `{{patient.mrn}}`, `{{doctor.name}}`, and repeater blocks `{{#each items}}`.

---

## 6. Template Storage & Data Models

### 6.1 Existing Data Models
- **`TemplateDefinition` (`data/model/template.model.ts`)**:
  ```typescript
  export interface TemplateDefinition {
    id: string;
    name: string;
    category: string;
    status: TemplateStatus; // 'draft' | 'published' | 'archived'
    version: number;
    schema: Record<string, unknown>;
    sampleData: Record<string, unknown>;
    html: string;
    css: string;
    createdAt: string;
    updatedAt: string;
  }
  ```
- **`DocumentFormat` (`data/model/document-formats.model.ts`)**:
  Defines structure, category (`invoices`, `reports`, `medical`, etc.), icon, badges, and default HTML/CSS markup for built-in studio templates.
- **`ClinicalAuditEvent` & `PatientContext` (`data/model/clinical-document.model.ts`)**:
  Captures patient demographics (MRN, Name, DOB, Allergies, Encounter, Clinician) and audit history (`created`, `updated`, `previewed`, `reviewed`, `signed`).

### 6.2 Storage Mechanisms
- **Current**: In-browser `localStorage` and `sessionStorage`.
- **Legacy/Dormant**: Commented remote storage endpoints in `GrapeEditorService` referencing `/clinical-form-editor-data/` via Bearer token HTTP POST.

---

## 7. AI Implementation & Template Search

### 7.1 Current Status
- **Client-Side Semantic Search**: Implemented in `FormBuilderComponent.onAISearch()`. It utilizes a regex/intent matcher parsing user queries in **English and German** (e.g., matching "Arztbericht", "Rechnung", "Medical report", "Intake form", "Lieferschein").
- **Workflow**:
  - If a matched template format is identified with high confidence, it directly loads the template onto the canvas and triggers a notification toast.
  - If no exact template matches, it opens the Template Gallery dialog with the search query pre-filtered.
- **Current Limitation**: There is no live integration with external LLM endpoints (Gemini, OpenAI, or private healthcare models). Template generation via natural language is not yet connected to a structured intermediate schema.

---

## 8. Export & Document Generation

### 8.1 Current Implementation
- **Preview Canvas**: Available via top toolbar button, routing to `/home/form-view` with state passed through Angular router navigation extras and backed up in `sessionStorage`.
- **Print / PDF Generation**: Triggered via `window.print()` inside an isolated popup window (`FormViewComponent.print()`).
- **Shortcomings**:
  - No headless server-side PDF generation pipeline (e.g., Puppeteer, Chromium, Weasyprint).
  - High vulnerability to client browser print engine discrepancies, page-break clipping, and font-rendering inconsistencies.
  - Does not support background/batch asynchronous PDF generation via REST API.

---

## 9. Backend Architecture, APIs & Authentication

### 9.1 Backend Architecture
- **Current State**: The repository currently contains **no native backend server**. It is packaged solely as a static Angular application served by Nginx.
- **External Proxy Neutralization**: The development proxy (`proxy.conf.json`) formerly routed to `https://mykarecloud360-dev.hatiintl.com.my/`. This was neutralized (`{}`) to eliminate timeout errors when working offline or independently of the external vendor.

### 9.2 API Communication Layer (`LzApiService`)
- `LzApiService` wraps Angular's `HttpClient` using an older callback pattern (`ApiCallBack` interface with `onResult` and `onError`).
- Rather than returning typed RxJS `Observable<T>`, methods trigger callback hooks. This pattern makes chaining, retry logic, error handling, and test mocking cumbersome.

### 9.3 Authentication & Authorization
- **Mechanism**: `ngx-cookie-service` inspects cookies for a Base64-encoded `accessToken` and `accessTokenExpiryDate`.
- **Guard Status**: `AuthGuardService` is implemented in `projects/form-builder/src/app/guard/auth-guard.service.ts` but is **commented out** in `app-routing.module.ts`.
- **RBAC**: No Role-Based Access Control (RBAC) or tenant isolation is currently implemented.

---

## 10. Security Risks & Vulnerability Analysis

| Vulnerability / Risk | Severity | Location | Description & Impact | Remediation Plan |
| :--- | :--- | :--- | :--- | :--- |
| **Plaintext Token Console Logging** | **HIGH** | `token.interceptor.ts` (Lines 30-38) | Interceptor explicitly prints Bearer tokens and cookie values to `console.log`. Vulnerable to token harvesting in shared browser sessions. | Strip all sensitive token logging immediately in production builds. |
| **Disabled Route Guards** | **HIGH** | `app-routing.module.ts` (Line 12) | `AuthGuardService` is commented out, allowing unauthenticated navigation to all editor routes. | Re-enable auth guards with unified JWT/OAuth2 verification once auth service is active. |
| **Unsanitized Script Execution** | **MEDIUM** | `grapesjs-script-editor` & `form-view.component.ts` | Allows users to embed raw JavaScript (`<script>` tags) into template HTML, executed in preview iframe. | Restrict script execution; enforce safe Handlebars data-binding syntax rather than raw JS code execution. |
| **Dual CDN & Bundle Loading** | **MEDIUM** | `index.html` (Lines 32-52) | GrapesJS and plugins are loaded via unpkg CDN while simultaneously bundled via npm. Causes version skew and offline vulnerability. | Remove external CDN script tags; rely exclusively on npm package bundling. |
| **Client-Side Sensitive Health Data in LocalStorage** | **HIGH** | `clinical-workflow.service.ts` | Mock patient context (Name, MRN, Allergies) stored unencrypted in browser `localStorage`. Violates basic healthcare data standards. | Migrate all patient data binding to transient memory or secure, authenticated server APIs. Never persist PHI in localStorage. |
| **Absence of Server-Side RBAC** | **CRITICAL** | Entire Application | Zero server-side authorization enforcement. Anyone with client access can manipulate template states. | Implement server-side multi-tenant RBAC (Phase 10 & 11). |

---

## 11. Technical Debt & Code Quality Assessment

1. **Monolithic Editor Component (`form-builder.component.ts`)**:
   - Spans over 1,750 lines.
   - Handles canvas initialization, block manager subscriptions, dialog lifecycle, demographic field addition, mock clinical auditing, template searching, and preview caching in a single class.
   - *Recommendation*: Modularize into discrete feature components and services (e.g., `TemplateGalleryDialogComponent`, `DemographicsManagerService`, `CanvasToolbarComponent`).

2. **Antiquated API Callback Pattern (`LzApiService`)**:
   - Uses `ApiCallBack` interface with `onResult` / `onError` instead of idiomatic RxJS observables (`Observable<T>`) or async/await Promises.
   - *Recommendation*: Refactor to clean, typed RxJS observable pipelines.

3. **Dual Internationalization Keys**:
   - `assets/i18n` contains both `English.json` / `German.json` and `en.json` / `de.json`.
   - *Recommendation*: Standardize on ISO 639-1 language codes (`en.json`, `de.json`).

4. **Missing Test Coverage**:
   - Existing unit tests (`*.spec.ts`) only instantiate components without supplying dependencies or mocks, causing them to fail or be ignored during CI/CD.
   - *Recommendation*: Implement unit tests for pure services (`TemplateRendererService`, `TemplateStoreService`) and integration tests for template serialization.

---

## 12. Reusable Core Assets Identified

The existing codebase contains solid foundational building blocks that can be directly leveraged:
1. **GrapesJS Layout & Table Plugins**: Powerful WYSIWYG canvas already configured with custom CSS classes and trait inspectors.
2. **Document Studio Presets (`DOCUMENT_FORMATS`)**: 12 pre-built, responsive HTML/CSS document structures spanning invoices, clinical summaries, and reports.
3. **Template Renderer Engine (`TemplateRendererService`)**: Safe variable interpolation engine supporting dotted paths (`{{patient.name}}`) and repeating blocks (`{{#each items}}`) with HTML escaping.
4. **Demographic Field Configuration Engine**: Clean UI and block-generator pattern for adding dynamic inputs with icon associations.
5. **PrimeNG Enterprise Theming**: Pre-configured responsive layout and styling system (`primeflex`, `primeng/dialog`, `primeng/table`).

---

## 13. Recommended Next Steps (Roadmap Alignment)

To execute the master plan smoothly without regressions, development should proceed in strict sequential phases:

```
[Phase 0: Audit Complete]
       │
       ▼
[Phase 1: Core Domain Model] ─── Define Workspace, Tenant, Template, Version, Document, Audit models
       │
       ▼
[Phase 2: Template Engine] ───── Schema-driven variable inserter, custom fonts, brand styles
       │
       ▼
[Phase 3: Data Binding Engine] ── Safe Handlebars-like binding, nested fields, conditionals (if/each)
       │
       ▼
[Phase 5: AI Template Search] ── Natural language query parsing with structured attribute matching
       │
       ▼
[Phase 8: PDF Pipeline] ──────── Independent headless PDF rendering (A4, page breaks, print CSS)
       │
       ▼
[Phase 9 & 10: Multi-Tenant API] Versioned REST API with Organization/Workspace isolation
```

### Immediate Priority for Phase 1:
- Define comprehensive TypeScript domain models in a dedicated core domain module (`Workspace`, `Organization`, `User`, `Role`, `Template`, `TemplateVersion`, `Document`, `FormSubmission`, `DataSchema`, `Brand`, `AuditEvent`).
- Decouple domain models from external EMR assumptions, keeping the core generic while allowing healthcare configurations via schemas.

---

*Audit completed by Antigravity Autonomous Agent. No functional application code was altered during this audit.*
