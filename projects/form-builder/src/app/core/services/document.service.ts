import { Injectable, Optional } from '@angular/core';
import {
  Document,
  DocumentStatus,
  DocumentAuditItem,
  DocumentGenerationOptions,
  BatchDocumentGenerationRequest,
  BatchDocumentGenerationResult,
} from '../domain/document.model';
import { DataBindingEngine, BindingOptions } from '../engine/data-binding-engine';
import { TenantWorkspaceService } from './tenant-workspace.service';
import { RbacService } from './rbac.service';
import { AuditLogService } from './audit-log.service';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private readonly STORAGE_KEY = 'form_builder_documents_v1';
  private documents: Document[] = [];

  constructor(
    @Optional() private tenantWorkspaceService?: TenantWorkspaceService,
    @Optional() private rbacService?: RbacService,
    @Optional() private auditLogService?: AuditLogService
  ) {
    this.loadDocuments();
  }

  /**
   * Retrieves all document instances, sorted with most recently updated first.
   */
  public getDocuments(): Document[] {
    return [...this.documents].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * Retrieves documents filtered by the current active workspace.
   */
  public getDocumentsForActiveWorkspace(): Document[] {
    const all = this.getDocuments();
    if (!this.tenantWorkspaceService) {
      return all;
    }
    return this.tenantWorkspaceService.filterByActiveWorkspace(all, true);
  }

  /**
   * Retrieves documents filtered by a specific workspace ID.
   */
  public getDocumentsByWorkspace(workspaceId: string): Document[] {
    return this.getDocuments().filter((d) => d.workspaceId === workspaceId);
  }

  /**
   * Retrieves a document instance by its ID.
   */
  public getDocumentById(id: string): Document | undefined {
    return this.documents.find((d) => d.id === id);
  }

  /**
   * Generates a new Document instance by merging template markup with structured payload data,
   * compiles the final HTML via DataBindingEngine, logs initial audit, and persists to store.
   */
  public generateAndSaveDocument(params: {
    templateId: string;
    templateName?: string;
    title: string;
    templateHtml: string;
    payload: Record<string, unknown>;
    category?: string;
    documentType?: string;
    options?: DocumentGenerationOptions;
  }): Document {
    if (this.rbacService && !this.rbacService.hasPermission('document:generate')) {
      throw new Error('Access Denied: Missing required permission document:generate');
    }

    const now = new Date().toISOString();
    const docId = `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const curUser = this.rbacService?.getCurrentUser();
    const defaultActor = curUser ? `${curUser.firstName} ${curUser.lastName}` : 'Dr. Clinician';
    const actor = params.options?.actor || defaultActor;

    const bindingOpts: BindingOptions = {
      locale: params.options?.locale || 'de-DE',
      defaultCurrency: params.options?.currency || 'EUR',
      defaultDateFormat: params.options?.dateFormat || 'YYYY-MM-DD',
      emptyValuePlaceholder: '—',
    };

    // Render markup using DataBindingEngine
    const renderedHtml = DataBindingEngine.render(
      params.templateHtml || '',
      params.payload || {},
      bindingOpts
    );

    // Extract patient / client metadata if present
    const p = params.payload as Record<string, any>;
    const patientName =
      p.patient?.name || p.name || p.client?.name || p.patientName || undefined;
    const patientMrn =
      p.patient?.mrn || p.patient?.id || p.mrn || p.refId || p.invoice?.number || undefined;

    const initialStatus = params.options?.initialStatus || 'rendered';

    const initialAudit: DocumentAuditItem[] = [
      {
        id: `AUD-${Date.now()}-1`,
        timestamp: now,
        action: 'created',
        actor,
        note: `Document instance generated from template "${params.templateName || params.templateId}"`,
      },
    ];

    if (initialStatus === 'reviewed') {
      initialAudit.push({
        id: `AUD-${Date.now()}-2`,
        timestamp: now,
        action: 'reviewed',
        actor,
        note: 'Clinical document reviewed and verified',
      });
    } else if (initialStatus === 'signed') {
      initialAudit.push({
        id: `AUD-${Date.now()}-3`,
        timestamp: now,
        action: 'signed',
        actor,
        note: 'Clinically signed and legally authorized',
      });
    }

    const newDoc: Document = {
      id: docId,
      workspaceId:
        params.options?.workspaceId ||
        this.tenantWorkspaceService?.getActiveWorkspaceId() ||
        'ws_default',
      templateId: params.templateId,
      templateName: params.templateName || 'Custom Template',
      title: params.title.trim() || `Document ${docId}`,
      status: initialStatus,
      category: params.category || 'clinical_documents',
      documentType: params.documentType || 'form',
      payload: params.payload,
      rawTemplateHtml: params.templateHtml,
      renderedHtml,
      patientName,
      patientMrn,
      metadata: {
        generatedVia: 'Healthcare Document Generation Pipeline',
        locale: bindingOpts.locale,
        currency: bindingOpts.defaultCurrency,
      },
      auditTrail: initialAudit,
      createdBy: actor,
      createdAt: now,
      updatedAt: now,
      signedAt: initialStatus === 'signed' ? now : undefined,
      signedBy: initialStatus === 'signed' ? actor : undefined,
    };

    this.documents.unshift(newDoc);
    this.saveToStorage();

    try {
      this.auditLogService?.recordEvent('document.generated', 'document', docId, {
        templateId: params.templateId,
        templateName: params.templateName || 'Custom Template',
        documentType: params.documentType || 'standard',
        status: initialStatus,
      });
    } catch {
      // Safe fallback
    }

    return newDoc;
  }

  /**
   * Updates an existing document's payload, automatically re-rendering the output HTML
   * and creating an audit record.
   */
  public updatePayloadAndReRender(
    id: string,
    newPayload: Record<string, unknown>,
    actor: string = 'Dr. Clinician',
    note?: string
  ): Document | undefined {
    const doc = this.getDocumentById(id);
    if (!doc) return undefined;

    const now = new Date().toISOString();
    const templateHtml = doc.rawTemplateHtml || doc.renderedHtml || '';

    const renderedHtml = DataBindingEngine.render(templateHtml, newPayload, {
      locale: (doc.metadata?.['locale'] as string) || 'de-DE',
      defaultCurrency: (doc.metadata?.['currency'] as string) || 'EUR',
      emptyValuePlaceholder: '—',
    });

    const p = newPayload as Record<string, any>;
    if (p.patient?.name || p.name) {
      doc.patientName = p.patient?.name || p.name;
    }
    if (p.patient?.mrn || p.mrn) {
      doc.patientMrn = p.patient?.mrn || p.mrn;
    }

    doc.payload = newPayload;
    doc.renderedHtml = renderedHtml;
    doc.updatedAt = now;

    doc.auditTrail.push({
      id: `AUD-${Date.now()}`,
      timestamp: now,
      action: 'updated',
      actor,
      note: note || 'Data payload modified; document re-rendered',
    });

    this.saveToStorage();
    return doc;
  }

  /**
   * Transitions a document instance status (e.g. draft -> reviewed -> signed).
   */
  public updateDocumentStatus(
    id: string,
    status: DocumentStatus,
    actor: string = 'Dr. Clinician',
    note?: string
  ): Document | undefined {
    const doc = this.getDocumentById(id);
    if (!doc) return undefined;

    const now = new Date().toISOString();
    doc.status = status;
    doc.updatedAt = now;

    if (status === 'signed') {
      doc.signedAt = now;
      doc.signedBy = actor;
    }

    let actionType: DocumentAuditItem['action'] = 'updated';
    if (status === 'reviewed') actionType = 'reviewed';
    if (status === 'signed') actionType = 'signed';
    if (status === 'archived') actionType = 'archived';

    doc.auditTrail.push({
      id: `AUD-${Date.now()}`,
      timestamp: now,
      action: actionType,
      actor,
      note: note || `Status transitioned to ${status.toUpperCase()}`,
    });

    this.saveToStorage();
    return doc;
  }

  /**
   * Deletes a document instance from storage.
   */
  public deleteDocument(id: string): boolean {
    if (this.rbacService && !this.rbacService.hasPermission('document:delete')) {
      throw new Error('Access Denied: Missing required permission document:delete');
    }
    const initialLen = this.documents.length;
    this.documents = this.documents.filter((d) => d.id !== id);
    const deleted = this.documents.length < initialLen;
    if (deleted) {
      this.saveToStorage();
      try {
        this.auditLogService?.recordEvent('document.deleted', 'document', id);
      } catch {
        // Safe fallback
      }
    }
    return deleted;
  }

  /**
   * Batch generation pipeline: iterates over an array of patient/record datasets,
   * rendering and generating separate Document instances for each record.
   */
  public batchGenerate(
    request: BatchDocumentGenerationRequest,
    options?: DocumentGenerationOptions
  ): BatchDocumentGenerationResult {
    const result: BatchDocumentGenerationResult = {
      totalProcessed: request.records.length,
      successful: 0,
      failed: 0,
      documents: [],
      errors: [],
    };

    const pattern = request.titlePattern || `${request.templateName} - {{patient.name}}`;

    for (const [idx, record] of request.records.entries()) {
      try {
        const title = DataBindingEngine.render(pattern, record).trim() ||
          `${request.templateName} #${idx + 1}`;

        const doc = this.generateAndSaveDocument({
          templateId: request.templateId,
          templateName: request.templateName,
          title,
          templateHtml: request.templateHtml,
          payload: record,
          category: request.category,
          documentType: request.documentType,
          options,
        });

        result.successful++;
        result.documents.push(doc);
      } catch (err: any) {
        result.failed++;
        result.errors.push(`Record #${idx + 1}: ${err?.message || 'Generation failed'}`);
      }
    }

    return result;
  }

  /**
   * Triggers client-side download of document as standalone formatted HTML file.
   */
  public exportDocumentAsHtml(doc: Document): void {
    const htmlContent = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>${doc.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; padding: 30px; margin: 0; }
    .doc-export-container { max-width: 820px; margin: 0 auto; background: #ffffff; padding: 40px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border-radius: 8px; }
    @media print {
      body { background: transparent; padding: 0; }
      .doc-export-container { box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="doc-export-container">
    ${doc.renderedHtml || ''}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    this.triggerDownload(blob, `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.html`);

    doc.auditTrail.push({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'exported',
      actor: 'System',
      note: 'Exported as standalone HTML file',
    });
    this.saveToStorage();
  }

  /**
   * Triggers client-side download of document metadata and payload as JSON file.
   */
  public exportDocumentAsJson(doc: Document): void {
    const exportData = {
      documentId: doc.id,
      title: doc.title,
      templateId: doc.templateId,
      templateName: doc.templateName,
      status: doc.status,
      patientName: doc.patientName,
      patientMrn: doc.patientMrn,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      signedAt: doc.signedAt,
      signedBy: doc.signedBy,
      payload: doc.payload,
      auditTrail: doc.auditTrail,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    this.triggerDownload(blob, `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
  }

  /**
   * Returns pre-configured realistic clinical sample payloads for interactive testing.
   */
  public getSamplePayloads(): Record<string, Record<string, unknown>> {
    return {
      physiotherapy: {
        patient: {
          name: 'Max Mustermann',
          dob: '1982-05-14',
          mrn: 'MRN-DE-98214',
          phone: '+49 30 555-0192',
          email: 'max.mustermann@example.de',
          insurance: 'Techniker Krankenkasse (TK)',
        },
        doctor: {
          name: 'Dr. med. Stefan Berger',
          specialty: 'Orthopädie & Unfallchirurgie',
        },
        encounter: {
          date: '2026-09-06',
          type: 'Erstbefund / Initial Assessment',
          diagnosis: 'M54.5 Lumbago mit Myogelosen der LWS',
        },
        pain_score: '7/10 (stark belastungsabhängig)',
        treatment_goals: 'Schmerzreduktion LWS, Wiederherstellung physiologische Beweglichkeit',
      },
      dental: {
        patient: {
          name: 'Sophie Weber',
          dob: '2015-08-22',
          mrn: 'MRN-DE-54120',
          phone: '+49 89 231-4455',
          email: 'family.weber@example.de',
        },
        doctor: {
          name: 'Dr. med. dent. Clara Hoffmann',
        },
        encounter: {
          date: '2026-09-06',
          type: 'Pädiatrische Vorsorgeuntersuchung',
        },
        dmf_index: '0 (kariesfrei)',
        fluoridation: 'Durchgeführt mit Elmex Gelee',
      },
      discharge: {
        patient: {
          name: 'Alexander Schmidt',
          dob: '1968-11-03',
          mrn: 'MRN-DE-10492',
          phone: '+49 40 882-9901',
          email: 'a.schmidt@example.de',
        },
        admissionDate: '2026-08-28',
        dischargeDate: '2026-09-06',
        diagnosis: 'I21.0 Akuter transmuraler Myokardinfarkt der Vorderwand (erfolgreiche PCI mit DES)',
        doctor: {
          name: 'Prof. Dr. med. Michael Braun',
          title: 'Chefarzt Kardiologie',
        },
        dischargeVitals: {
          bp: '124/78 mmHg',
          hr: '68 bpm',
          o2: '98% Raumluft',
        },
        medications: [
          { name: 'ASA (Aspirin)', dose: '100 mg', freq: '1-0-0' },
          { name: 'Ticagrelor (Brilique)', dose: '90 mg', freq: '1-0-1' },
          { name: 'Atorvastatin', dose: '80 mg', freq: '0-0-1' },
          { name: 'Ramipril', dose: '5 mg', freq: '1-0-0' },
        ],
      },
      invoice: {
        invoice: {
          number: 'INV-2026-0841',
          date: '2026-09-06',
          dueDate: '2026-09-20',
          taxId: 'DE284910293',
        },
        client: {
          name: 'Hanna Fischer',
          address: 'Kurfürstendamm 142, 10707 Berlin',
          email: 'hanna.fischer@example.de',
        },
        items: [
          { description: 'GOÄ 1 - Eingehende Beratung / Konsultation', qty: 1, rate: 45.0, amount: 45.0 },
          { description: 'GOÄ 5 - Symptombezogene Untersuchung', qty: 1, rate: 35.0, amount: 35.0 },
          { description: 'GOÄ 505 - Sonographie Abdomen', qty: 1, rate: 82.5, amount: 82.5 },
          { description: 'GOÄ 250 - Blutentnahme mittels Vakuum', qty: 1, rate: 12.0, amount: 12.0 },
        ],
        subtotal: 174.5,
        tax: 0.0,
        total: 174.5,
      },
    };
  }

  // --- Internal Storage & Helper Methods ---

  private loadDocuments(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        this.documents = JSON.parse(raw);
        return;
      }
    } catch (e) {
      console.warn('Could not load documents from localStorage:', e);
    }

    // Seed realistic healthcare document instances on first run
    this.seedInitialDocuments();
  }

  public resetToDefaults(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {}
    this.seedInitialDocuments();
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.documents));
    } catch (e) {
      console.error('Failed to persist documents to localStorage:', e);
    }
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private seedInitialDocuments(): void {
    const samples = this.getSamplePayloads();
    const now = new Date();

    const physioSample = samples['physiotherapy'];
    const dentalSample = samples['dental'];
    const dischargeSample = samples['discharge'];
    const invoiceSample = samples['invoice'];

    this.documents = [
      {
        id: 'DOC-2026-9821',
        workspaceId: 'ws-default',
        templateId: 'physio_assessment',
        templateName: 'Physiotherapie Patientenaufnahme & Erstbefund',
        title: 'Physiotherapie Erstbefund - Max Mustermann',
        status: 'reviewed',
        category: 'physiotherapy',
        documentType: 'form',
        payload: physioSample,
        patientName: 'Max Mustermann',
        patientMrn: 'MRN-DE-98214',
        renderedHtml: `
          <div style="font-family: sans-serif; padding: 25px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="border-bottom: 2px solid #7c3aed; padding-bottom: 12px; margin-bottom: 20px;">
              <h2 style="color: #7c3aed; margin: 0;">PRAXIS FÜR PHYSIOTHERAPIE & REHABILITATION</h2>
              <p style="color: #64748b; margin: 4px 0 0 0; font-size: 12px;">Erstbefund & Behandlungsplan</p>
            </div>
            <h3 style="text-align: center; text-transform: uppercase;">Physiotherapie Patientenaufnahme</h3>
            <p><strong>Patient:</strong> Max Mustermann | <strong>Geburtsdatum:</strong> 1982-05-14 | <strong>MRN:</strong> MRN-DE-98214</p>
            <p><strong>Überweisender Arzt:</strong> Dr. med. Stefan Berger | <strong>Schmerz-Score (VAS):</strong> 7/10</p>
            <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; margin: 15px 0;">
              <strong>Diagnose / Befund:</strong> M54.5 Lumbago mit Myogelosen der LWS. Behandlungsziel: Schmerzreduktion LWS, Wiederherstellung Beweglichkeit.
            </div>
            <div style="margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 11px; color: #64748b;">
              Status: Geprüft & Freigegeben durch Therapeuten | Datum: 2026-09-06
            </div>
          </div>
        `,
        auditTrail: [
          {
            id: 'AUD-001',
            timestamp: new Date(now.getTime() - 3600000 * 5).toISOString(),
            action: 'created',
            actor: 'T. Wagner (Physiotherapeut)',
            note: 'Initial assessment document created',
          },
          {
            id: 'AUD-002',
            timestamp: new Date(now.getTime() - 3600000 * 2).toISOString(),
            action: 'reviewed',
            actor: 'Dr. med. Stefan Berger',
            note: 'Clinical findings and diagnosis confirmed',
          },
        ],
        createdBy: 'T. Wagner (Physiotherapeut)',
        createdAt: new Date(now.getTime() - 3600000 * 5).toISOString(),
        updatedAt: new Date(now.getTime() - 3600000 * 2).toISOString(),
      },
      {
        id: 'DOC-2026-5412',
        workspaceId: 'ws-default',
        templateId: 'dental_exam',
        templateName: 'Zahnärztlicher Befund & Behandlungsplan',
        title: 'Pediatric Dental Plan - Sophie Weber',
        status: 'signed',
        category: 'dental',
        documentType: 'form',
        payload: dentalSample,
        patientName: 'Sophie Weber',
        patientMrn: 'MRN-DE-54120',
        renderedHtml: `
          <div style="font-family: sans-serif; padding: 25px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 20px;">
              <h2 style="color: #0d9488; margin: 0;">ZAHNARZTPRAXIS DR. CLARA HOFFMANN</h2>
              <p style="color: #64748b; margin: 4px 0 0 0; font-size: 12px;">Pädiatrische Zahnheilkunde & Prophylaxe</p>
            </div>
            <h3 style="text-align: center; text-transform: uppercase;">Zahnärztlicher Untersuchungsbefund</h3>
            <p><strong>Patientin:</strong> Sophie Weber | <strong>Geburtsdatum:</strong> 2015-08-22 | <strong>MRN:</strong> MRN-DE-54120</p>
            <p><strong>Befund:</strong> DMF-Index: 0 (kariesfrei) | <strong>Maßnahme:</strong> Fluoridierung mit Elmex Gelee</p>
            <div style="margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 11px; color: #64748b;">
              Status: Elektronisch signiert von Dr. med. dent. Clara Hoffmann am 2026-09-06
            </div>
          </div>
        `,
        auditTrail: [
          {
            id: 'AUD-101',
            timestamp: new Date(now.getTime() - 3600000 * 8).toISOString(),
            action: 'created',
            actor: 'Dr. Clara Hoffmann',
            note: 'Pediatric examination charted',
          },
          {
            id: 'AUD-102',
            timestamp: new Date(now.getTime() - 3600000 * 1).toISOString(),
            action: 'signed',
            actor: 'Dr. Clara Hoffmann',
            note: 'Clinically sealed and authorized',
          },
        ],
        createdBy: 'Dr. Clara Hoffmann',
        createdAt: new Date(now.getTime() - 3600000 * 8).toISOString(),
        updatedAt: new Date(now.getTime() - 3600000 * 1).toISOString(),
        signedAt: new Date(now.getTime() - 3600000 * 1).toISOString(),
        signedBy: 'Dr. Clara Hoffmann',
      },
      {
        id: 'DOC-2026-1049',
        workspaceId: 'ws-default',
        templateId: 'discharge_summary',
        templateName: 'Krankenhaus Entlassungsbericht',
        title: 'Discharge Summary - Alexander Schmidt',
        status: 'completed',
        category: 'clinical_documents',
        documentType: 'document',
        payload: dischargeSample,
        patientName: 'Alexander Schmidt',
        patientMrn: 'MRN-DE-10492',
        renderedHtml: `
          <div style="font-family: sans-serif; padding: 25px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px;">
              <h2 style="color: #2563eb; margin: 0;">KLINIKUM KARDIO-ZENTRUM</h2>
              <p style="color: #64748b; margin: 4px 0 0 0; font-size: 12px;">Ärztlicher Entlassungsbericht</p>
            </div>
            <h3>Entlassungsbericht: Alexander Schmidt</h3>
            <p><strong>Aufnahme:</strong> 2026-08-28 | <strong>Entlassung:</strong> 2026-09-06</p>
            <p><strong>Hauptdiagnose:</strong> I21.0 Akuter Vorderwandinfarkt (PCI mit DES)</p>
            <p><strong>Entlassungsmedikation:</strong> ASA 100mg, Ticagrelor 90mg 2x tgl., Atorvastatin 80mg, Ramipril 5mg</p>
          </div>
        `,
        auditTrail: [
          {
            id: 'AUD-201',
            timestamp: new Date(now.getTime() - 3600000 * 12).toISOString(),
            action: 'created',
            actor: 'Prof. Dr. Michael Braun',
            note: 'Discharge summary initiated',
          },
          {
            id: 'AUD-202',
            timestamp: now.toISOString(),
            action: 'signed',
            actor: 'Prof. Dr. Michael Braun',
            note: 'Final discharge sign-off completed',
          },
        ],
        createdBy: 'Prof. Dr. Michael Braun',
        createdAt: new Date(now.getTime() - 3600000 * 12).toISOString(),
        updatedAt: now.toISOString(),
        signedAt: now.toISOString(),
        signedBy: 'Prof. Dr. Michael Braun',
      },
      {
        id: 'DOC-2026-0841',
        workspaceId: 'ws-default',
        templateId: 'medical_invoice',
        templateName: 'Privatarztrechnung nach GOÄ',
        title: 'Rechnung Privatarzt - Hanna Fischer',
        status: 'draft',
        category: 'administrative',
        documentType: 'document',
        payload: invoiceSample,
        patientName: 'Hanna Fischer',
        patientMrn: 'INV-2026-0841',
        renderedHtml: `
          <div style="font-family: sans-serif; padding: 25px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 20px;">
              <h2 style="color: #059669; margin: 0;">PRAXISGEMEINSCHAFT BERLIN</h2>
              <p style="color: #64748b; margin: 4px 0 0 0; font-size: 12px;">Privatärztliche Liquidation</p>
            </div>
            <p><strong>Rechnungsempfängerin:</strong> Hanna Fischer | <strong>Rechnungs-Nr:</strong> INV-2026-0841</p>
            <p><strong>Gesamtbetrag fällig:</strong> 174,50 EUR</p>
          </div>
        `,
        auditTrail: [
          {
            id: 'AUD-301',
            timestamp: now.toISOString(),
            action: 'created',
            actor: 'M. Weber (Abrechnung)',
            note: 'Billing statement drafted',
          },
        ],
        createdBy: 'M. Weber (Abrechnung)',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    this.saveToStorage();
  }
}
