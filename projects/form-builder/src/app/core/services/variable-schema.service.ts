import { Injectable } from '@angular/core';
import { DataField, DataSchema } from '../domain/schema.model';

export interface VariableItem {
  key: string;              // e.g. 'patient.name'
  label: string;            // e.g. 'Patient Full Name'
  scope: string;            // e.g. 'patient', 'doctor', 'clinic', 'appointment', 'invoice', 'document'
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  placeholder?: string;
  sampleValue?: string;
  description?: string;
  isRepeatable?: boolean;   // true for arrays/lists like items, medications
  childFields?: VariableItem[];
}

export interface VariableScopeGroup {
  id: string;
  name: string;
  icon: string;
  description: string;
  variables: VariableItem[];
}

@Injectable({
  providedIn: 'root',
})
export class VariableSchemaService {
  /**
   * Built-in standard schema groups (domain-neutral + healthcare & business defaults).
   * These can be extended dynamically per workspace or template schema.
   */
  private readonly defaultScopeGroups: VariableScopeGroup[] = [
    {
      id: 'patient',
      name: 'Patient Demographics',
      icon: 'fa fa-user',
      description: 'Patient identity, contact, demographics, and clinical identifiers',
      variables: [
        { key: 'patient.name', label: 'Patient Name', scope: 'patient', type: 'string', sampleValue: 'Johnathan Doe' },
        { key: 'patient.dateOfBirth', label: 'Date of Birth', scope: 'patient', type: 'date', sampleValue: '1985-04-12' },
        { key: 'patient.mrn', label: 'Medical Record Number (MRN)', scope: 'patient', type: 'string', sampleValue: 'MRN-92841' },
        { key: 'patient.gender', label: 'Gender', scope: 'patient', type: 'string', sampleValue: 'Male' },
        { key: 'patient.bloodGroup', label: 'Blood Group', scope: 'patient', type: 'string', sampleValue: 'O+' },
        { key: 'patient.address', label: 'Patient Address', scope: 'patient', type: 'string', sampleValue: '124 Healthcare Ave, Suite 3' },
        { key: 'patient.phone', label: 'Phone Number', scope: 'patient', type: 'string', sampleValue: '+1 (555) 234-5678' },
        { key: 'patient.email', label: 'Email Address', scope: 'patient', type: 'string', sampleValue: 'john.doe@example.com' },
        { key: 'patient.insurance', label: 'Insurance Provider & Policy', scope: 'patient', type: 'string', sampleValue: 'Aetna Silver #948210' },
        { key: 'patient.allergies', label: 'Known Allergies', scope: 'patient', type: 'string', sampleValue: 'Penicillin, Latex' },
      ],
    },
    {
      id: 'doctor',
      name: 'Doctor / Clinician',
      icon: 'fa fa-user-md',
      description: 'Physician, practitioner, and healthcare provider details',
      variables: [
        { key: 'doctor.name', label: 'Doctor Full Name', scope: 'doctor', type: 'string', sampleValue: 'Dr. Sarah Müller, MD' },
        { key: 'doctor.registrationNumber', label: 'License / Registration No.', scope: 'doctor', type: 'string', sampleValue: 'MED-REG-84729' },
        { key: 'doctor.specialty', label: 'Clinical Specialty', scope: 'doctor', type: 'string', sampleValue: 'Internal Medicine / Cardiology' },
        { key: 'doctor.signature', label: 'Doctor Signature Placeholder', scope: 'doctor', type: 'string', sampleValue: '[Digitally Signed]' },
        { key: 'doctor.email', label: 'Doctor Email', scope: 'doctor', type: 'string', sampleValue: 'dr.mueller@medclinic.org' },
        { key: 'doctor.phone', label: 'Doctor Office Phone', scope: 'doctor', type: 'string', sampleValue: '+49 30 9283740' },
      ],
    },
    {
      id: 'clinic',
      name: 'Clinic & Facility',
      icon: 'fa fa-hospital-o',
      description: 'Healthcare organization, hospital, clinic, or practice metadata',
      variables: [
        { key: 'clinic.name', label: 'Clinic / Hospital Name', scope: 'clinic', type: 'string', sampleValue: 'St. Jude Community Health Center' },
        { key: 'clinic.address', label: 'Clinic Physical Address', scope: 'clinic', type: 'string', sampleValue: 'Berliner Str. 42, 10115 Berlin' },
        { key: 'clinic.phone', label: 'Clinic Reception Phone', scope: 'clinic', type: 'string', sampleValue: '+49 30 1234567' },
        { key: 'clinic.email', label: 'Clinic Contact Email', scope: 'clinic', type: 'string', sampleValue: 'info@stjude-health.org' },
        { key: 'clinic.logo', label: 'Clinic Logo URL', scope: 'clinic', type: 'string', sampleValue: 'https://example.com/logo.png' },
        { key: 'clinic.registrationNumber', label: 'Tax / Institution ID', scope: 'clinic', type: 'string', sampleValue: 'DE-TAX-994821' },
      ],
    },
    {
      id: 'appointment',
      name: 'Encounter & Appointment',
      icon: 'fa fa-calendar',
      description: 'Clinical visit, consultation, or appointment episode',
      variables: [
        { key: 'appointment.date', label: 'Appointment Date', scope: 'appointment', type: 'date', sampleValue: '2026-09-10' },
        { key: 'appointment.time', label: 'Appointment Time', scope: 'appointment', type: 'string', sampleValue: '10:30 AM' },
        { key: 'appointment.encounterId', label: 'Encounter Number', scope: 'appointment', type: 'string', sampleValue: 'ENC-2026-8812' },
        { key: 'appointment.reason', label: 'Visit Reason / Chief Complaint', scope: 'appointment', type: 'string', sampleValue: 'Routine cardiovascular follow-up' },
        { key: 'appointment.room', label: 'Room / Examination Bay', scope: 'appointment', type: 'string', sampleValue: 'Examination Suite 3B' },
      ],
    },
    {
      id: 'billing',
      name: 'Billing, Invoice & Items',
      icon: 'fa fa-dollar',
      description: 'Invoice numbers, line item repeaters, taxes, and totals',
      variables: [
        { key: 'invoice.number', label: 'Invoice Number', scope: 'billing', type: 'string', sampleValue: 'INV-2026-0042' },
        { key: 'invoice.date', label: 'Invoice Date', scope: 'billing', type: 'date', sampleValue: '2026-09-06' },
        { key: 'invoice.dueDate', label: 'Due Date', scope: 'billing', type: 'date', sampleValue: '2026-10-06' },
        { key: 'invoice.subtotal', label: 'Subtotal Amount', scope: 'billing', type: 'number', sampleValue: '€450.00' },
        { key: 'invoice.tax', label: 'Tax / VAT Amount', scope: 'billing', type: 'number', sampleValue: '€85.50' },
        { key: 'invoice.total', label: 'Total Amount', scope: 'billing', type: 'number', sampleValue: '€535.50' },
        {
          key: 'items',
          label: 'Invoice Line Items (Array)',
          scope: 'billing',
          type: 'array',
          isRepeatable: true,
          description: 'Iterates through line items using {{#each items}}',
          childFields: [
            { key: 'name', label: 'Item Name', scope: 'billing', type: 'string', sampleValue: 'General Consultation' },
            { key: 'description', label: 'Item Description', scope: 'billing', type: 'string', sampleValue: '45-minute clinical intake' },
            { key: 'quantity', label: 'Quantity', scope: 'billing', type: 'number', sampleValue: '1' },
            { key: 'rate', label: 'Unit Rate', scope: 'billing', type: 'number', sampleValue: '€250.00' },
            { key: 'amount', label: 'Line Total', scope: 'billing', type: 'number', sampleValue: '€250.00' },
          ],
        },
        {
          key: 'medications',
          label: 'Prescribed Medications (Array)',
          scope: 'billing',
          type: 'array',
          isRepeatable: true,
          description: 'Iterates through prescription rows using {{#each medications}}',
          childFields: [
            { key: 'name', label: 'Drug / Brand Name', scope: 'billing', type: 'string', sampleValue: 'Amoxicillin' },
            { key: 'dose', label: 'Dosage Strength', scope: 'billing', type: 'string', sampleValue: '500 mg' },
            { key: 'frequency', label: 'Frequency / Instructions', scope: 'billing', type: 'string', sampleValue: 'TID with meals for 7 days' },
          ],
        },
      ],
    },
    {
      id: 'document',
      name: 'Document & System Fields',
      icon: 'fa fa-file-text-o',
      description: 'Page numbering, document timestamps, and print metadata',
      variables: [
        { key: 'document.id', label: 'Document System ID', scope: 'document', type: 'string', sampleValue: 'DOC-88392-V1' },
        { key: 'document.title', label: 'Document Title', scope: 'document', type: 'string', sampleValue: 'Clinical Consultation Summary' },
        { key: 'document.date', label: 'Current Generation Date', scope: 'document', type: 'date', sampleValue: '06.09.2026' },
        { key: 'document.pageNumber', label: 'Current Page Number', scope: 'document', type: 'number', sampleValue: '1' },
        { key: 'document.totalPages', label: 'Total Pages Count', scope: 'document', type: 'number', sampleValue: '2' },
      ],
    },
  ];

  /** Custom variables registered dynamically */
  private customVariables: VariableItem[] = [];

  constructor() {
    this.loadCustomVariables();
  }

  /**
   * Returns all scope groups with built-in and registered variables.
   */
  public getScopeGroups(): VariableScopeGroup[] {
    const groups = JSON.parse(JSON.stringify(this.defaultScopeGroups)) as VariableScopeGroup[];
    if (this.customVariables.length > 0) {
      groups.push({
        id: 'custom',
        name: 'Custom & Workspace Variables',
        icon: 'fa fa-tags',
        description: 'Locally defined and workspace-specific dynamic variables',
        variables: [...this.customVariables],
      });
    }
    return groups;
  }

  /**
   * Returns a flattened array of all available variables across all scopes.
   */
  public getAllVariables(): VariableItem[] {
    const list: VariableItem[] = [];
    this.getScopeGroups().forEach((g) => {
      g.variables.forEach((v) => list.push(v));
    });
    return list;
  }

  /**
   * Registers a custom variable into the registry.
   */
  public registerCustomVariable(item: VariableItem): void {
    const existingIndex = this.customVariables.findIndex((v) => v.key === item.key);
    if (existingIndex >= 0) {
      this.customVariables[existingIndex] = item;
    } else {
      this.customVariables.push(item);
    }
    this.persistCustomVariables();
  }

  /**
   * Generates standard placeholder syntax: `{{variable.key}}`
   */
  public generateVariableSyntax(key: string): string {
    return `{{${key.trim()}}}`;
  }

  /**
   * Generates a safe conditional block:
   * {{#if variable.key}}
   *   <span>...</span>
   * {{/if}}
   */
  public generateConditionalSyntax(key: string, innerLabel?: string): string {
    const label = innerLabel || key;
    return `{{#if ${key.trim()}}}\n  <span class="dynamic-value">{{${key.trim()}}}</span>\n{{/if}}`;
  }

  /**
   * Generates a repeating section block for an array:
   * {{#each items}}
   *   <tr><td>{{name}}</td><td>{{amount}}</td></tr>
   * {{/each}}
   */
  public generateRepeaterSyntax(item: VariableItem): string {
    if (item.key === 'medications') {
      return `<table class="doc-table" style="width:100%; border-collapse:collapse; margin-top:8px;">
  <thead>
    <tr style="background:#f1f5f9; border-bottom:2px solid #cbd5e1;">
      <th style="padding:8px; text-align:left;">Medication</th>
      <th style="padding:8px; text-align:left;">Dosage</th>
      <th style="padding:8px; text-align:left;">Frequency</th>
    </tr>
  </thead>
  <tbody>
    {{#each medications}}
    <tr style="border-bottom:1px solid #e2e8f0;">
      <td style="padding:8px; font-weight:600;">{{name}}</td>
      <td style="padding:8px;">{{dose}}</td>
      <td style="padding:8px;">{{frequency}}</td>
    </tr>
    {{/each}}
  </tbody>
</table>`;
    }

    if (item.childFields && item.childFields.length > 0) {
      const headers = item.childFields.map((f) => `<th style="padding:8px; text-align:left;">${f.label}</th>`).join('');
      const cells = item.childFields.map((f) => `<td style="padding:8px;">{{${f.key}}}</td>`).join('');
      return `<table class="doc-table" style="width:100%; border-collapse:collapse; margin-top:8px;">
  <thead>
    <tr style="background:#f1f5f9; border-bottom:2px solid #cbd5e1;">
      ${headers}
    </tr>
  </thead>
  <tbody>
    {{#each ${item.key}}}
    <tr style="border-bottom:1px solid #e2e8f0;">
      ${cells}
    </tr>
    {{/each}}
  </tbody>
</table>`;
    }

    return `{{#each ${item.key}}}\n  <div>{{this}}</div>\n{{/each}}`;
  }

  private loadCustomVariables(): void {
    try {
      const saved = localStorage.getItem('form_builder_custom_variables_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.customVariables = parsed;
        }
      }
    } catch {
      this.customVariables = [];
    }
  }

  private persistCustomVariables(): void {
    try {
      localStorage.setItem('form_builder_custom_variables_v1', JSON.stringify(this.customVariables));
    } catch (e) {
      console.warn('Could not persist custom variables', e);
    }
  }
}
