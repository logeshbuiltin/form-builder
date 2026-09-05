export interface PatientContext {
  name: string;
  dateOfBirth: string;
  mrn: string;
  allergies: string;
  encounter: string;
  clinician: string;
}

export interface ClinicalAuditEvent {
  id: string;
  action: 'created' | 'saved' | 'reviewed' | 'signed' | 'previewed';
  actor: string;
  at: string;
  detail: string;
}
