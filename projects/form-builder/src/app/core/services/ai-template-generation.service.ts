import { Injectable } from '@angular/core';
import {
  TemplateFieldIR,
  TemplateIR,
  TemplateSectionIR,
  TemplateTableColumnIR,
} from '../domain/template-ir.model';

@Injectable({
  providedIn: 'root',
})
export class AITemplateGenerationService {
  /**
   * Generates a structured Template Intermediate Representation (IR) from natural language prompt.
   * Guarantees safe, structured data rather than untrusted arbitrary code.
   */
  public generateTemplateIR(
    prompt: string,
    options?: { industry?: string; documentType?: string; language?: string }
  ): TemplateIR {
    const raw = (prompt || '').trim();
    const q = raw.toLowerCase();

    // Determine language
    const isGerman =
      options?.language === 'German' ||
      q.includes('german') ||
      q.includes('deutsch') ||
      q.includes('physiotherapie') ||
      q.includes('erstbefund') ||
      q.includes('patientenaufnahme') ||
      q.includes('erwachsene') ||
      q.includes('krankengymnastik') ||
      q.includes('rechnung') ||
      q.includes('zahnarzt');

    const language = isGerman ? 'German' : 'English';

    // Check domain patterns
    if (q.includes('physio') || q.includes('krankengymnastik') || options?.industry === 'Physiotherapy') {
      return this.generatePhysiotherapyIR(raw, isGerman);
    } else if (q.includes('dent') || q.includes('zahn') || options?.industry === 'Dental') {
      return this.generateDentalIR(raw, isGerman);
    } else if (q.includes('consent') || q.includes('einwilligung')) {
      return this.generateConsentIR(raw, isGerman);
    } else if (q.includes('discharge') || q.includes('entlass')) {
      return this.generateDischargeIR(raw, isGerman);
    } else if (q.includes('invoice') || q.includes('rechnung') || q.includes('bill')) {
      return this.generateInvoiceIR(raw, isGerman);
    } else if (q.includes('lab') || q.includes('patholog') || q.includes('labor')) {
      return this.generateLaboratoryIR(raw, isGerman);
    }

    // Default Clinical Intake / Consultation Form
    return this.generateGenericClinicalIR(raw, isGerman);
  }

  /**
   * Compiles the Structured Template IR into clean, accessible, and printer-friendly HTML
   * for loading into GrapesJS canvas.
   */
  public compileIRToHtml(ir: TemplateIR): string {
    const brand = ir.branding || {
      organizationName: 'HEALTHCARE CLINICAL NETWORK',
      subtitle: 'Standardized Medical Record & Documentation',
      primaryColor: '#2563eb',
    };

    const primaryColor = brand.primaryColor || '#2563eb';
    const fontFamily = brand.fontFamily || "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

    let html = `
      <div class="doc-page ai-generated-template" style="max-width: 800px; margin: 0 auto; padding: 35px; background: #ffffff; font-family: ${fontFamily}; color: #1e293b; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <!-- Branded Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${primaryColor}; padding-bottom: 16px; margin-bottom: 22px;">
          <div>
            <h2 style="margin: 0; color: ${primaryColor}; font-size: 22px; font-weight: 800; letter-spacing: -0.2px;">${brand.organizationName}</h2>
            <p style="margin: 3px 0 0 0; font-size: 12px; color: #64748b;">${brand.subtitle || ''}</p>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            Ref ID: ${ir.id.toUpperCase()}<br>
            Language: ${ir.language} | ${ir.templateType.toUpperCase()}
          </div>
        </div>

        <!-- Document Headline -->
        <div style="text-align: center; margin-bottom: 24px;">
          <h3 style="margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 0.8px; color: #0f172a; font-weight: 800;">${ir.title}</h3>
        </div>
    `;

    // Render Sections
    for (const sec of ir.sections) {
      html += this.renderSectionHtml(sec, primaryColor);
    }

    // Signature Block or Footer
    if (ir.footerText) {
      html += `
        <div style="border-top: 1px solid #cbd5e1; padding-top: 14px; margin-top: 30px; font-size: 11px; color: #64748b; text-align: center;">
          ${ir.footerText}
        </div>
      `;
    }

    html += `</div>`;
    return html;
  }

  /**
   * Validates a TemplateIR object structure.
   */
  public validateIR(ir: TemplateIR): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!ir.id) errors.push('Template IR ID is required');
    if (!ir.title) errors.push('Template IR Title is required');
    if (!ir.sections || ir.sections.length === 0) errors.push('Template must have at least one section');

    for (const [idx, sec] of (ir.sections || []).entries()) {
      if (!sec.title) errors.push(`Section #${idx + 1} must have a title`);
      if (sec.layout !== 'table' && (!sec.fields || sec.fields.length === 0)) {
        errors.push(`Section "${sec.title || idx}" has no fields`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // --- Specialized Clinical Generators ---

  private generatePhysiotherapyIR(prompt: string, isGerman: boolean): TemplateIR {
    const title = isGerman
      ? 'Physiotherapie Patientenaufnahme & Erstbefund'
      : 'Physiotherapy Patient Intake & Assessment Form';

    const orgName = isGerman
      ? 'PRAXIS FÜR PHYSIOTHERAPIE & REHABILITATION'
      : 'ACTIVE MOTION PHYSIOTHERAPY & REHABILITATION';

    const subtitle = isGerman
      ? 'Ganzheitliche Bewegungstherapie & Manuelle Therapie'
      : 'Orthopedic Rehabilitation & Physical Therapy';

    return {
      id: 'ai_physio_intake_' + Date.now(),
      title,
      templateType: 'form',
      industry: 'physiotherapy',
      category: 'patient_forms',
      language: isGerman ? 'German' : 'English',
      country: isGerman ? 'Germany' : 'United States',
      branding: {
        organizationName: orgName,
        subtitle,
        primaryColor: '#7c3aed',
      },
      sections: [
        {
          id: 'sec_patient_info',
          title: isGerman ? '1. Patientendaten & Stammdaten' : '1. Patient Demographics & Contact',
          layout: 'three-column',
          fields: [
            { id: 'fld_name', label: isGerman ? 'Patientenname' : 'Patient Name', type: 'token', token: '{{patient.name}}', required: true, width: 'third' },
            { id: 'fld_dob', label: isGerman ? 'Geburtsdatum' : 'Date of Birth', type: 'token', token: '{{patient.dob}}', required: true, width: 'third' },
            { id: 'fld_mrn', label: isGerman ? 'Versicherungs-Nr. / MRN' : 'MRN / Insurance ID', type: 'token', token: '{{patient.mrn}}', width: 'third' },
            { id: 'fld_phone', label: isGerman ? 'Telefonnummer' : 'Phone Number', type: 'token', token: '{{patient.phone}}', width: 'third' },
            { id: 'fld_email', label: isGerman ? 'E-Mail-Adresse' : 'Email Address', type: 'token', token: '{{patient.email}}', width: 'third' },
            { id: 'fld_doctor', label: isGerman ? 'Überweisender Arzt' : 'Referring Physician', type: 'token', token: '{{doctor.name}}', width: 'third' },
          ],
        },
        {
          id: 'sec_anamnesis',
          title: isGerman ? '2. Anamnese & Aktuelle Beschwerden' : '2. Anamnesis & Present Complaints',
          layout: 'two-column',
          fields: [
            { id: 'fld_complaint', label: isGerman ? 'Hauptbeschwerde / Leitsymptom' : 'Chief Complaint', type: 'textarea', placeholder: isGerman ? 'z.B. Schultersteife rechts, Schmerzen seit 3 Wochen...' : 'e.g. Right shoulder pain, onset 3 weeks ago...', width: 'half' },
            { id: 'fld_vas', label: isGerman ? 'Schmerzskala (VAS 1 - 10)' : 'Pain Intensity (VAS 1 - 10)', type: 'token', token: '{{pain_score}}', defaultValue: '6 / 10', width: 'half' },
            { id: 'fld_onset', label: isGerman ? 'Beginn & Ursache (Unfall/chronisch)' : 'Onset & Mechanism of Injury', type: 'text', width: 'half' },
            { id: 'fld_aggravating', label: isGerman ? 'Schmerzverstärkende Faktoren' : 'Aggravating / Relieving Factors', type: 'text', width: 'half' },
          ],
        },
        {
          id: 'sec_contraindications',
          title: isGerman ? '3. Klinische Warnhinweise & Kontraindikationen' : '3. Clinical Contraindications & Red Flags',
          layout: 'alert',
          alertType: 'warning',
          fields: [
            { id: 'fld_red_flags', label: isGerman ? 'Bestehende Risiken' : 'Contraindication Check', type: 'token', token: '{{patient.allergies}}', defaultValue: isGerman ? 'Herzschrittmacher: Nein | Antikoagulation: Ja | Osteoporose: Bekannt' : 'Pacemaker: No | Anticoagulants: Yes | Osteoporosis: Known', width: 'full' },
          ],
        },
        {
          id: 'sec_rom_table',
          title: isGerman ? '4. Bewegungsbefund & Kraftmessung (ROM)' : '4. Range of Motion (ROM) & Mobility Matrix',
          layout: 'table',
          tableColumns: [
            { key: 'joint', label: isGerman ? 'Gelenk / Bewegung' : 'Joint / Movement', width: '35%' },
            { key: 'rom', label: isGerman ? 'Aktives Bewegungsausmaß' : 'Active ROM', width: '35%' },
            { key: 'strength', label: isGerman ? 'Muskelkraft (0-5)' : 'Muscle Strength (0-5)', width: '30%' },
          ],
          tableRows: [
            { joint: isGerman ? 'Flexion (Beugung)' : 'Flexion', rom: '120° (Endgradiger Schmerz)', strength: '4 / 5' },
            { joint: isGerman ? 'Abduktion (Abspreizen)' : 'Abduction', rom: '105°', strength: '3+ / 5' },
            { joint: isGerman ? 'Außenrotation' : 'External Rotation', rom: '55°', strength: '4 / 5' },
          ],
          fields: [],
        },
        {
          id: 'sec_treatment_goals',
          title: isGerman ? '5. Therapieziele & Behandlungsplan' : '5. Rehabilitation Goals & Treatment Plan',
          layout: 'single',
          fields: [
            { id: 'fld_goals', label: isGerman ? 'Vereinbarte Therapieziele' : 'Rehab Goals', type: 'textarea', defaultValue: isGerman ? '1. Schmerzreduktion in Ruhe und Bewegung.\n2. Wiedererlangung der vollständigen Überkopf-Beweglichkeit.\n3. Kräftigung der Rotatorenmanschette und Schulterblattstabilisatoren.' : '1. Pain reduction at rest and activity.\n2. Full overhead functional mobility.\n3. Rotator cuff strengthening.', width: 'full' },
          ],
        },
        {
          id: 'sec_signature',
          title: isGerman ? '6. Bestätigung & Unterschriften' : '6. Verification & Signatures',
          layout: 'two-column',
          fields: [
            { id: 'fld_sig_patient', label: isGerman ? 'Unterschrift Patient / Betreuer' : 'Patient / Guardian Signature', type: 'signature', token: '{{patient.name}}', width: 'half' },
            { id: 'fld_sig_therapist', label: isGerman ? 'Unterschrift Physiotherapeut/in' : 'Physical Therapist Signature', type: 'signature', token: '{{therapist_name}}', width: 'half' },
          ],
        },
      ],
      footerText: isGerman
        ? 'Dokumentation gemäß Berufsordnung für Physiotherapeuten. Alle Daten unterliegen der Schweigepflicht.'
        : 'Confidential Physical Therapy Clinical Assessment Record.',
    };
  }

  private generateDentalIR(prompt: string, isGerman: boolean): TemplateIR {
    return {
      id: 'ai_dental_exam_' + Date.now(),
      title: isGerman ? 'Zahnärztlicher Befund & Behandlungsplan' : 'Dental Examination & Treatment Plan',
      templateType: 'form',
      industry: 'dental',
      category: 'dental',
      language: isGerman ? 'German' : 'English',
      branding: {
        organizationName: isGerman ? 'ZAHNMEDIZINISCHES ZENTRUM' : 'APEX DENTAL CLINIC',
        subtitle: isGerman ? 'Zahnheilkunde, Implantologie & Prophylaxe' : 'Restorative & Preventive Dentistry',
        primaryColor: '#0284c7',
      },
      sections: [
        {
          id: 'sec_patient',
          title: isGerman ? 'Patientenstammdaten' : 'Patient Details',
          layout: 'two-column',
          fields: [
            { id: 'f1', label: isGerman ? 'Patientenname' : 'Patient Name', type: 'token', token: '{{patient.name}}', width: 'half' },
            { id: 'f2', label: isGerman ? 'Geburtsdatum' : 'Date of Birth', type: 'token', token: '{{patient.dob}}', width: 'half' },
          ],
        },
        {
          id: 'sec_dental_table',
          title: isGerman ? 'Zahnstatus & Befundung' : 'Tooth Charting & Findings',
          layout: 'table',
          tableColumns: [
            { key: 'tooth', label: isGerman ? 'Zahn / Region' : 'Tooth #', width: '25%' },
            { key: 'diagnosis', label: isGerman ? 'Befund' : 'Diagnosis', width: '40%' },
            { key: 'therapy', label: isGerman ? 'Geplante Therapie' : 'Planned Therapy', width: '35%' },
          ],
          tableRows: [
            { tooth: '#16 / #17', diagnosis: isGerman ? 'Approximalkaries' : 'Interproximal Caries', therapy: isGerman ? 'Kompositfüllung (2-flächig)' : 'Composite Filling' },
            { tooth: '#36', diagnosis: isGerman ? 'Pulpitis chronica' : 'Chronic Pulpitis', therapy: isGerman ? 'Wurzelkanalbehandlung (Endo)' : 'Root Canal Treatment' },
            { tooth: isGerman ? 'Gesamtes Gebiss' : 'Full Mouth', diagnosis: isGerman ? 'Gingivitis levis' : 'Gingivitis (Mild)', therapy: isGerman ? 'Professionelle Zahnreinigung (PZR)' : 'Prophylaxis & Scaling' },
          ],
          fields: [],
        },
        {
          id: 'sec_sign',
          title: isGerman ? 'Bestätigung' : 'Signatures',
          layout: 'two-column',
          fields: [
            { id: 's1', label: isGerman ? 'Zahnarzt / Zahnärztin' : 'Dentist Signature', type: 'signature', token: '{{dentist_name}}', width: 'half' },
            { id: 's2', label: isGerman ? 'Patient / Zahlungspflichtiger' : 'Patient Signature', type: 'signature', token: '{{patient.name}}', width: 'half' },
          ],
        },
      ],
      footerText: isGerman ? 'Heil- und Kostenplan gültig für 6 Monate ab Erstellung.' : 'Dental treatment estimates valid for 6 months.',
    };
  }

  private generateConsentIR(prompt: string, isGerman: boolean): TemplateIR {
    return {
      id: 'ai_consent_' + Date.now(),
      title: isGerman ? 'Aufklärung & Einwilligungserklärung' : 'Informed Consent & Procedure Authorization',
      templateType: 'form',
      industry: 'healthcare',
      category: 'patient_forms',
      language: isGerman ? 'German' : 'English',
      branding: {
        organizationName: isGerman ? 'KLINIKUM FÜR CHIRURGIE' : 'SURGICAL SPECIALTY CENTER',
        subtitle: isGerman ? 'Patientenaufklärung vor medizinischen Eingriffen' : 'Informed Clinical Procedure Consent',
        primaryColor: '#1e40af',
      },
      sections: [
        {
          id: 'sec_meta',
          title: isGerman ? 'Eingriff & Beteiligte' : 'Procedure & Participants',
          layout: 'two-column',
          fields: [
            { id: 'p1', label: isGerman ? 'Patientenname' : 'Patient Name', type: 'token', token: '{{patient.name}}', width: 'half' },
            { id: 'p2', label: isGerman ? 'Bezeichnung des Eingriffs' : 'Procedure Name', type: 'token', token: '{{procedure.name}}', width: 'half' },
            { id: 'p3', label: isGerman ? 'Aufklärender Arzt' : 'Attending Physician', type: 'token', token: '{{doctor.name}}', width: 'half' },
            { id: 'p4', label: isGerman ? 'Datum der Aufklärung' : 'Date of Consultation', type: 'token', token: '{{date}}', width: 'half' },
          ],
        },
        {
          id: 'sec_risks',
          title: isGerman ? 'Risikoaufklärung & Belehrung' : 'Risk Disclosures',
          layout: 'alert',
          alertType: 'warning',
          fields: [
            { id: 'r1', label: isGerman ? 'Wichtige Aufklärungsinhalte' : 'Disclosed Risks', type: 'text', defaultValue: isGerman ? 'Über mögliche Risiken (Nachblutung, Infektion, allergische Reaktionen, Nervenreizung) wurde ausführlich und verständlich informiert.' : 'Known risks including hemorrhage, infection, and anesthesia reaction have been fully explained.', width: 'full' },
          ],
        },
        {
          id: 'sec_sig',
          title: isGerman ? 'Einwilligungserklärung' : 'Voluntary Consent',
          layout: 'two-column',
          fields: [
            { id: 'sig1', label: isGerman ? 'Unterschrift Patient' : 'Patient Signature', type: 'signature', token: '{{patient.name}}', width: 'half' },
            { id: 'sig2', label: isGerman ? 'Unterschrift Aufklärender Arzt' : 'Physician Signature', type: 'signature', token: '{{doctor.name}}', width: 'half' },
          ],
        },
      ],
      footerText: isGerman ? 'Dokumentation gemäß § 630e BGB (Patientenrechtegesetz).' : 'Legal consent for medical treatment.',
    };
  }

  private generateDischargeIR(prompt: string, isGerman: boolean): TemplateIR {
    return {
      id: 'ai_discharge_' + Date.now(),
      title: isGerman ? 'Ärztlicher Entlassungsbrief' : 'Clinical Discharge Summary',
      templateType: 'document',
      industry: 'healthcare',
      category: 'clinical_documents',
      language: isGerman ? 'German' : 'English',
      branding: {
        organizationName: isGerman ? 'STÄDTISCHES KLINIKUM' : 'METRO GENERAL HOSPITAL',
        subtitle: isGerman ? 'Klinik für Innere Medizin & Notfallversorgung' : 'Department of Internal Medicine',
        primaryColor: '#0f766e',
      },
      sections: [
        {
          id: 'sec_stay',
          title: isGerman ? 'Aufenthalt & Diagnose' : 'Admission & Diagnosis',
          layout: 'two-column',
          fields: [
            { id: 'd1', label: isGerman ? 'Patient' : 'Patient', type: 'token', token: '{{patient.name}}', width: 'half' },
            { id: 'd2', label: isGerman ? 'Hauptdiagnose' : 'Primary Diagnosis', type: 'token', token: '{{diagnosis}}', width: 'half' },
            { id: 'd3', label: isGerman ? 'Aufnahmedatum' : 'Admission Date', type: 'token', token: '{{admission_date}}', width: 'half' },
            { id: 'd4', label: isGerman ? 'Entlassungsdatum' : 'Discharge Date', type: 'token', token: '{{discharge_date}}', width: 'half' },
          ],
        },
        {
          id: 'sec_meds',
          title: isGerman ? 'Entlassungsmedikation' : 'Discharge Medications',
          layout: 'table',
          tableColumns: [
            { key: 'drug', label: isGerman ? 'Präparat / Wirkstoff' : 'Medication', width: '40%' },
            { key: 'dose', label: isGerman ? 'Dosierung' : 'Dosage', width: '30%' },
            { key: 'timing', label: isGerman ? 'Einnahmehinweis' : 'Frequency', width: '30%' },
          ],
          tableRows: [
            { drug: 'Pantoprazol 40mg', dose: '1-0-0', timing: isGerman ? 'Morgens nüchtern' : 'Morning before breakfast' },
            { drug: 'Metoprololsuccinat 47.5mg', dose: '1-0-0', timing: isGerman ? 'Morgens nach dem Essen' : 'Morning with meal' },
          ],
          fields: [],
        },
      ],
      footerText: isGerman ? 'Weiterbehandlung durch den Hausarzt empfohlen.' : 'Follow-up with primary care physician required.',
    };
  }

  private generateInvoiceIR(prompt: string, isGerman: boolean): TemplateIR {
    return {
      id: 'ai_invoice_' + Date.now(),
      title: isGerman ? 'Privatärztliche Rechnung & Honorarabrechnung' : 'Medical Invoice & Billing Statement',
      templateType: 'document',
      industry: 'administrative',
      category: 'administrative',
      language: isGerman ? 'German' : 'English',
      branding: {
        organizationName: isGerman ? 'ARZTPRAXIS FÜR ALLGEMEINMEDIZIN' : 'PRIMARY MEDICAL CARE BILLING',
        subtitle: isGerman ? 'Abrechnung gemäß GOÄ' : 'Itemized Medical Statement',
        primaryColor: '#059669',
      },
      sections: [
        {
          id: 'sec_inv_meta',
          title: isGerman ? 'Rechnungsempfänger' : 'Invoice Details',
          layout: 'two-column',
          fields: [
            { id: 'i1', label: isGerman ? 'Rechnungsnummer' : 'Invoice No', type: 'token', token: '{{invoice_number}}', width: 'half' },
            { id: 'i2', label: isGerman ? 'Leistungsdatum' : 'Service Date', type: 'token', token: '{{service_date}}', width: 'half' },
            { id: 'i3', label: isGerman ? 'Patientenname' : 'Patient Name', type: 'token', token: '{{patient.name}}', width: 'half' },
            { id: 'i4', label: isGerman ? 'Zahlungsziel' : 'Due Date', type: 'text', defaultValue: isGerman ? '14 Tage ohne Abzug' : 'Due upon receipt', width: 'half' },
          ],
        },
        {
          id: 'sec_inv_items',
          title: isGerman ? 'Leistungsaufstellung' : 'Itemized Services',
          layout: 'table',
          tableColumns: [
            { key: 'code', label: isGerman ? 'Ziffer / Code' : 'Code', width: '20%' },
            { key: 'desc', label: isGerman ? 'Leistungsbeschreibung' : 'Description', width: '50%' },
            { key: 'amount', label: isGerman ? 'Betrag' : 'Amount', width: '30%' },
          ],
          tableRows: [
            { code: 'GOÄ 1', desc: isGerman ? 'Beratung - auch mittels Fernsprecher' : 'Clinical Consultation', amount: '€ 10.72' },
            { code: 'GOÄ 7', desc: isGerman ? 'Vollständige körperliche Untersuchung' : 'Full Physical Examination', amount: '€ 21.45' },
            { code: 'GOÄ 250', desc: isGerman ? 'Blutentnahme mittels Venenpunktion' : 'Venipuncture / Blood Draw', amount: '€ 4.20' },
          ],
          fields: [],
        },
      ],
      footerText: isGerman ? 'Zahlbar innerhalb von 14 Tagen unter Angabe der Rechnungsnummer.' : 'Payment due upon receipt.',
    };
  }

  private generateLaboratoryIR(prompt: string, isGerman: boolean): TemplateIR {
    return {
      id: 'ai_lab_' + Date.now(),
      title: isGerman ? 'Laborbefund & Analysebericht' : 'Diagnostic Laboratory Pathology Report',
      templateType: 'report',
      industry: 'laboratory',
      category: 'laboratory',
      language: isGerman ? 'German' : 'English',
      branding: {
        organizationName: isGerman ? 'MEDIZINISCHES LABOR ZENTRUM' : 'CLINICAL PATHOLOGY DIAGNOSTICS',
        subtitle: isGerman ? 'Akkreditiertes Fachlabor für klinische Chemie' : 'Accredited Clinical Diagnostic Laboratory',
        primaryColor: '#d97706',
      },
      sections: [
        {
          id: 'sec_lab_meta',
          title: isGerman ? 'Probenstammdaten' : 'Specimen Details',
          layout: 'two-column',
          fields: [
            { id: 'l1', label: isGerman ? 'Patient' : 'Patient', type: 'token', token: '{{patient.name}}', width: 'half' },
            { id: 'l2', label: isGerman ? 'Proben-ID' : 'Sample Barcode', type: 'token', token: '{{sample_id}}', width: 'half' },
          ],
        },
        {
          id: 'sec_results',
          title: isGerman ? 'Laborparameter' : 'Test Findings',
          layout: 'table',
          tableColumns: [
            { key: 'param', label: isGerman ? 'Parameter' : 'Parameter', width: '35%' },
            { key: 'val', label: isGerman ? 'Messwert' : 'Result', width: '25%' },
            { key: 'ref', label: isGerman ? 'Referenzbereich' : 'Reference Range', width: '40%' },
          ],
          tableRows: [
            { param: isGerman ? 'Nüchtern-Glukose' : 'Fasting Glucose', val: '112 mg/dL (!)', ref: '70 - 99 mg/dL' },
            { param: isGerman ? 'HbA1c' : 'Hemoglobin A1c', val: '6.2 % (!)', ref: '4.0 - 5.6 %' },
            { param: isGerman ? 'Kreatinin' : 'Creatinine', val: '0.9 mg/dL', ref: '0.7 - 1.2 mg/dL' },
          ],
          fields: [],
        },
      ],
      footerText: isGerman ? 'Elektronisch validiert durch den leitenden Laborarzt.' : 'Electronically validated report.',
    };
  }

  private generateGenericClinicalIR(prompt: string, isGerman: boolean): TemplateIR {
    return {
      id: 'ai_generic_' + Date.now(),
      title: isGerman ? 'Klinischer Dokumentationsbogen' : 'Clinical Consultation & Examination Record',
      templateType: 'form',
      industry: 'healthcare',
      category: 'clinical_documents',
      language: isGerman ? 'German' : 'English',
      branding: {
        organizationName: isGerman ? 'KLINISCHES GESUNDHEITSZENTRUM' : 'REGIONAL HEALTH NETWORK',
        subtitle: isGerman ? 'Ambulante Patientenversorgung' : 'Outpatient Clinical Services',
        primaryColor: '#2563eb',
      },
      sections: [
        {
          id: 'sec_demog',
          title: isGerman ? 'Patientenstammdaten' : 'Patient Information',
          layout: 'three-column',
          fields: [
            { id: 'g1', label: isGerman ? 'Patientenname' : 'Patient Name', type: 'token', token: '{{patient.name}}', width: 'third' },
            { id: 'g2', label: isGerman ? 'Geburtsdatum' : 'Date of Birth', type: 'token', token: '{{patient.dob}}', width: 'third' },
            { id: 'g3', label: isGerman ? 'Patienten-ID' : 'MRN / ID', type: 'token', token: '{{patient.mrn}}', width: 'third' },
          ],
        },
        {
          id: 'sec_findings',
          title: isGerman ? 'Klinischer Befund & Verlauf' : 'Clinical Findings & Assessment',
          layout: 'single',
          fields: [
            { id: 'g4', label: isGerman ? 'Untersuchungsbefund' : 'Examination Notes', type: 'textarea', placeholder: isGerman ? 'Klinische Beobachtungen eintragen...' : 'Enter clinical observations...', width: 'full' },
          ],
        },
      ],
      footerText: isGerman ? 'Vertrauliche Patientenakte.' : 'Confidential Medical Record.',
    };
  }

  private renderSectionHtml(sec: TemplateSectionIR, primaryColor: string): string {
    let out = `<div style="margin-bottom: 22px;">`;

    // Section Header
    out += `
      <div style="background: ${primaryColor}; color: #ffffff; padding: 6px 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; border-radius: 4px 4px 0 0; display: flex; justify-content: space-between; align-items: center;">
        <span>${sec.title}</span>
      </div>
    `;

    // Alert Callout
    if (sec.layout === 'alert') {
      const bgColor = sec.alertType === 'critical' ? '#fef2f2' : '#fffbeb';
      const borderColor = sec.alertType === 'critical' ? '#ef4444' : '#f59e0b';
      const textColor = sec.alertType === 'critical' ? '#991b1b' : '#92400e';

      out += `
        <div style="background: ${bgColor}; border: 1px solid ${borderColor}; border-top: none; border-left: 4px solid ${borderColor}; padding: 12px 14px; border-radius: 0 0 4px 4px; font-size: 12px; color: ${textColor};">
      `;
      for (const f of sec.fields) {
        out += `<p style="margin: 0;"><strong>${f.label}:</strong> ${f.token || f.defaultValue || ''}</p>`;
      }
      out += `</div>`;
      out += `</div>`;
      return out;
    }

    // Table Layout
    if (sec.layout === 'table' && sec.tableColumns && sec.tableColumns.length > 0) {
      out += `
        <div style="border: 1px solid #cbd5e1; border-top: none; border-radius: 0 0 4px 4px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #cbd5e1; color: #475569; text-align: left;">
      `;
      for (const col of sec.tableColumns) {
        out += `<th style="padding: 8px 10px; width: ${col.width || 'auto'};">${col.label}</th>`;
      }
      out += `</tr></thead><tbody>`;

      for (const row of sec.tableRows || []) {
        out += `<tr style="border-bottom: 1px solid #e2e8f0;">`;
        for (const col of sec.tableColumns) {
          out += `<td style="padding: 8px 10px;">${row[col.key] || ''}</td>`;
        }
        out += `</tr>`;
      }

      out += `</tbody></table></div></div>`;
      return out;
    }

    // Standard Grid Fields Layout
    let gridCols = '1fr';
    if (sec.layout === 'two-column') gridCols = '1fr 1fr';
    if (sec.layout === 'three-column') gridCols = '1fr 1fr 1fr';

    out += `
      <div style="border: 1px solid #cbd5e1; border-top: none; padding: 14px; border-radius: 0 0 4px 4px; font-size: 13px;">
        <div style="display: grid; grid-template-columns: ${gridCols}; gap: 12px;">
    `;

    for (const f of sec.fields) {
      if (f.type === 'signature') {
        out += `
          <div style="margin-top: 15px;">
            <label style="display: block; font-size: 11px; color: #64748b; margin-bottom: 4px;">${f.label}</label>
            <div style="border-bottom: 1px solid #475569; padding-bottom: 4px; font-weight: 600; font-size: 13px;">
              ${f.token || f.defaultValue || '______________________'}
            </div>
            <span style="font-size: 10px; color: #94a3b8; display: block; margin-top: 2px;">Authorized Signature & Stamp</span>
          </div>
        `;
      } else if (f.type === 'textarea') {
        out += `
          <div style="grid-column: 1 / -1;">
            <label style="display: block; font-size: 11px; color: #64748b; margin-bottom: 4px;">${f.label}</label>
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 10px; font-size: 12px; min-height: 48px; white-space: pre-line;">
              ${f.defaultValue || f.placeholder || ''}
            </div>
          </div>
        `;
      } else {
        out += `
          <div>
            <span style="display: block; font-size: 11px; color: #64748b;">${f.label}</span>
            <strong style="color: #0f172a; font-size: 13px;">${f.token || f.defaultValue || '—'}</strong>
          </div>
        `;
      }
    }

    out += `</div></div></div>`;
    return out;
  }
}
