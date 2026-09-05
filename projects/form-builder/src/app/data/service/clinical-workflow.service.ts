import { Injectable } from '@angular/core';
import { ClinicalAuditEvent, PatientContext } from '../model/clinical-document.model';

/** Local-only workflow adapter. Replace with authenticated backend APIs before clinical use. */
@Injectable({ providedIn: 'root' })
export class ClinicalWorkflowService {
  private readonly contextKey = 'form_builder_clinical_context_v1';
  private readonly auditKey = 'form_builder_clinical_audit_v1';

  getContext(): PatientContext {
    try {
      return { name: '', dateOfBirth: '', mrn: '', allergies: '', encounter: '', clinician: '', ...JSON.parse(localStorage.getItem(this.contextKey) || '{}') };
    } catch {
      return { name: '', dateOfBirth: '', mrn: '', allergies: '', encounter: '', clinician: '' };
    }
  }

  saveContext(context: PatientContext): void {
    localStorage.setItem(this.contextKey, JSON.stringify(context));
  }

  listAudit(): ClinicalAuditEvent[] {
    try {
      const events = JSON.parse(localStorage.getItem(this.auditKey) || '[]');
      return Array.isArray(events) ? events : [];
    } catch {
      return [];
    }
  }

  record(action: ClinicalAuditEvent['action'], actor: string, detail: string): ClinicalAuditEvent {
    const event: ClinicalAuditEvent = { id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, action, actor, detail, at: new Date().toISOString() };
    localStorage.setItem(this.auditKey, JSON.stringify([event, ...this.listAudit()].slice(0, 100)));
    return event;
  }
}
