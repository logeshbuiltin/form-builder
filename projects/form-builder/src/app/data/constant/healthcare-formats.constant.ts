import { DocumentFormat } from '../model/document-formats.model';

export const HEALTHCARE_DOCUMENT_FORMATS: DocumentFormat[] = [
  // 1. Patient Registration & Intake Form
  {
    id: 'patient_registration',
    name: 'Patient Registration & Intake',
    shortName: 'Patient Intake',
    icon: 'fa fa-id-card-o',
    emoji: '📋',
    category: 'patient_forms',
    categoryLabel: 'Patient Forms',
    documentTypeId: 'patient_registration',
    industry: 'healthcare',
    description: 'Comprehensive patient onboarding form covering demographics, emergency contacts, medical history, allergies, and insurance details.',
    features: ['Demographics Grid', 'Emergency Contacts', 'Allergy Warning Box', 'Insurance Details', 'Patient Sign-Off'],
    tokens: [
      { key: 'patient.name', label: 'Patient Name', example: 'Eleanor Vance' },
      { key: 'patient.mrn', label: 'MRN / UHID', example: 'MRN-449102' },
      { key: 'patient.dob', label: 'Date of Birth', example: '1988-04-14' },
      { key: 'patient.phone', label: 'Contact Phone', example: '+1 (555) 381-9024' },
      { key: 'patient.allergies', label: 'Known Allergies', example: 'Penicillin, Sulfa drugs' },
      { key: 'insurance.provider', label: 'Insurance Provider', example: 'BlueCross Health' },
    ],
    previewSvg: `
      <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #ffffff; border: 1px solid #e2e8f0; display: block; margin: 0 auto 6px;">
        <rect x="0" y="0" width="160" height="22" fill="#2563eb" rx="3"/>
        <rect x="8" y="7" width="70" height="8" fill="#ffffff" rx="2"/>
        <rect x="8" y="28" width="144" height="22" fill="#eff6ff" stroke="#bfdbfe" rx="2"/>
        <circle cx="20" cy="39" r="6" fill="#3b82f6"/>
        <rect x="32" y="33" width="50" height="5" fill="#1e40af" rx="1"/>
        <rect x="32" y="41" width="35" height="4" fill="#60a5fa" rx="1"/>
        <rect x="8" y="55" width="144" height="20" fill="#fef2f2" stroke="#fecaca" rx="2"/>
        <rect x="12" y="60" width="40" height="4" fill="#dc2626" rx="1"/>
        <rect x="8" y="80" width="70" height="12" fill="#f1f5f9" rx="2"/>
        <rect x="84" y="80" width="68" height="12" fill="#f1f5f9" rx="2"/>
      </svg>
    `,
    defaultHtml: `
      <div class="doc-page patient-intake-container" style="max-width: 800px; margin: 0 auto; padding: 35px; background: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 22px;">
          <div>
            <h2 style="margin: 0; color: #2563eb; font-size: 22px; font-weight: 800;">METRO HEALTH CLINICAL NETWORK</h2>
            <p style="margin: 3px 0 0 0; font-size: 12px; color: #64748b;">Patient Onboarding & Medical Record Registration</p>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            Form Ref: ADM-INT-2026<br>
            Confidential Medical Record
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 20px;">
          <h3 style="margin: 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; font-weight: 800;">NEW PATIENT REGISTRATION & INTAKE</h3>
        </div>

        <!-- Section 1: Demographics -->
        <div style="margin-bottom: 20px;">
          <div style="background: #2563eb; color: #ffffff; padding: 6px 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; border-radius: 4px 4px 0 0;">
            1. Personal Demographics
          </div>
          <div style="border: 1px solid #cbd5e1; border-top: none; padding: 14px; border-radius: 0 0 4px 4px; font-size: 13px;">
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; margin-bottom: 10px;">
              <div><strong style="color: #475569;">Full Legal Name:</strong> {{patient.name}}</div>
              <div><strong style="color: #475569;">Date of Birth:</strong> {{patient.dob}}</div>
              <div><strong style="color: #475569;">Gender:</strong> {{patient.gender}}</div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
              <div><strong style="color: #475569;">MRN / ID:</strong> {{patient.mrn}}</div>
              <div><strong style="color: #475569;">Contact Phone:</strong> {{patient.phone}}</div>
              <div><strong style="color: #475569;">Email:</strong> {{patient.email}}</div>
            </div>
          </div>
        </div>

        <!-- Section 2: Allergies & Alert -->
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-left: 5px solid #ef4444; border-radius: 4px; padding: 12px 16px; margin-bottom: 20px;">
          <strong style="color: #991b1b; font-size: 13px; display: block; margin-bottom: 4px;">⚠️ CLINICAL ALLERGIES & SENSITIVITIES</strong>
          <p style="margin: 0; font-size: 12px; color: #7f1d1d;">{{patient.allergies}}</p>
        </div>

        <!-- Section 3: Emergency Contact & Insurance -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px;">
            <h4 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #1e40af;">Emergency Contact</h4>
            <div style="font-size: 12px; line-height: 1.6;">
              <div><strong>Name:</strong> {{emergency.name}}</div>
              <div><strong>Relationship:</strong> {{emergency.relationship}}</div>
              <div><strong>Phone:</strong> {{emergency.phone}}</div>
            </div>
          </div>
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px;">
            <h4 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #1e40af;">Primary Insurance</h4>
            <div style="font-size: 12px; line-height: 1.6;">
              <div><strong>Provider:</strong> {{insurance.provider}}</div>
              <div><strong>Policy Number:</strong> {{insurance.policyNumber}}</div>
              <div><strong>Group ID:</strong> {{insurance.groupNumber}}</div>
            </div>
          </div>
        </div>

        <!-- Signature -->
        <div style="border-top: 1px solid #cbd5e1; padding-top: 18px; margin-top: 25px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div style="font-size: 11px; color: #64748b; max-width: 450px;">
            I certify that all information provided above is complete and accurate to the best of my knowledge.
          </div>
          <div style="text-align: center; border-top: 1px solid #475569; width: 220px; padding-top: 6px; font-size: 12px; font-weight: 600;">
            Patient / Guardian Signature & Date
          </div>
        </div>
      </div>
    `,
  },

  // 2. Patient Informed Consent Form
  {
    id: 'consent_form',
    name: 'Informed Consent & Procedure Authorization',
    shortName: 'Consent Form',
    icon: 'fa fa-pencil-square-o',
    emoji: '✍️',
    category: 'patient_forms',
    categoryLabel: 'Patient Forms',
    documentTypeId: 'consent_form',
    industry: 'healthcare',
    description: 'Standardized legal and clinical consent for diagnostic, therapeutic, or surgical procedures with risk disclosures.',
    features: ['Procedure Disclosure', 'Risks & Complications', 'Patient Attestation', 'Dual Signature Sign-off'],
    tokens: [
      { key: 'patient.name', label: 'Patient Name', example: 'David Miller' },
      { key: 'procedure.name', label: 'Procedure Name', example: 'Diagnostic Upper Endoscopy (EGD)' },
      { key: 'doctor.name', label: 'Attending Physician', example: 'Dr. Katherine Price, MD' },
      { key: 'date', label: 'Consent Date', example: '2026-09-06' },
    ],
    previewSvg: `
      <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #ffffff; border: 1px solid #e2e8f0; display: block; margin: 0 auto 6px;">
        <rect x="0" y="0" width="160" height="20" fill="#1e40af" rx="3"/>
        <rect x="8" y="6" width="65" height="8" fill="#ffffff" rx="2"/>
        <rect x="8" y="27" width="144" height="15" fill="#f8fafc" stroke="#cbd5e1" rx="2"/>
        <rect x="8" y="47" width="144" height="25" fill="#fefce8" stroke="#fef08a" rx="2"/>
        <rect x="12" y="52" width="50" height="4" fill="#a16207" rx="1"/>
        <rect x="8" y="78" width="68" height="15" fill="#f1f5f9" rx="2"/>
        <rect x="84" y="78" width="68" height="15" fill="#f1f5f9" rx="2"/>
      </svg>
    `,
    defaultHtml: `
      <div class="doc-page consent-container" style="max-width: 800px; margin: 0 auto; padding: 35px; background: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <div style="border-bottom: 2px solid #1e40af; padding-bottom: 14px; margin-bottom: 20px; text-align: center;">
          <h2 style="margin: 0; color: #1e40af; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">INFORMED CONSENT FOR MEDICAL / SURGICAL PROCEDURE</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Clinical Department of Surgery & Interventional Care</p>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 6px; margin-bottom: 18px; font-size: 13px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div><strong>Patient Name:</strong> {{patient.name}}</div>
            <div><strong>MRN / ID:</strong> {{patient.mrn}}</div>
            <div><strong>Procedure:</strong> {{procedure.name}}</div>
            <div><strong>Attending Physician:</strong> {{doctor.name}}</div>
          </div>
        </div>

        <div style="font-size: 12px; line-height: 1.6; color: #334155; margin-bottom: 16px;">
          <h4 style="margin: 0 0 6px 0; font-size: 13px; color: #0f172a; text-transform: uppercase;">1. Explanation of Procedure</h4>
          <p style="margin: 0 0 10px 0;">I have been fully informed by the attending physician regarding the nature, purpose, potential benefits, risks, and foreseeable complications of the procedure named above.</p>

          <h4 style="margin: 0 0 6px 0; font-size: 13px; color: #0f172a; text-transform: uppercase;">2. Risks & Known Complications</h4>
          <div style="background: #fffbeb; border: 1px solid #fef08a; padding: 10px 14px; border-radius: 4px; margin-bottom: 12px;">
            Risks may include, but are not limited to: infection, adverse reaction to sedation or anesthesia, hemorrhage, and rare unexpected tissue trauma. Alternative treatments have been discussed.
          </div>

          <h4 style="margin: 0 0 6px 0; font-size: 13px; color: #0f172a; text-transform: uppercase;">3. Patient Voluntary Consent</h4>
          <p style="margin: 0;">I acknowledge that no guarantee has been made as to the final results of the procedure. I hereby authorize the surgical team to perform the procedure.</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 35px;">
          <div style="text-align: center; border-top: 1px solid #475569; padding-top: 6px; font-size: 12px;">
            <strong>{{patient.name}}</strong><br>
            <span style="color: #64748b; font-size: 11px;">Patient / Authorized Representative Signature</span>
          </div>
          <div style="text-align: center; border-top: 1px solid #475569; padding-top: 6px; font-size: 12px;">
            <strong>{{doctor.name}}</strong><br>
            <span style="color: #64748b; font-size: 11px;">Attending Physician Signature & License No.</span>
          </div>
        </div>
      </div>
    `,
  },

  // 3. Hospital Discharge Summary
  {
    id: 'discharge_summary',
    name: 'Hospital Inpatient Discharge Summary',
    shortName: 'Discharge Summary',
    icon: 'fa fa-hospital-o',
    emoji: '🏥',
    category: 'clinical_documents',
    categoryLabel: 'Clinical Documents',
    documentTypeId: 'discharge_summary',
    industry: 'healthcare',
    description: 'Inpatient discharge document summarizing hospital course, surgical procedures, final diagnosis, discharge medications, and follow-up plan.',
    features: ['Admission & Discharge Dates', 'Hospital Course', 'Medication Table', 'Discharge Instructions', 'Physician Stamp'],
    tokens: [
      { key: 'patient.name', label: 'Patient Name', example: 'Marcus Brody' },
      { key: 'patient.mrn', label: 'MRN / UHID', example: 'MRN-772183' },
      { key: 'admission_date', label: 'Admission Date', example: '2026-08-30' },
      { key: 'discharge_date', label: 'Discharge Date', example: '2026-09-05' },
      { key: 'diagnosis', label: 'Final Diagnosis', example: 'Acute Cholecystitis (Post Laparoscopic Cholecystectomy)' },
      { key: 'doctor.name', label: 'Attending Surgeon', example: 'Dr. Marcus Holloway, MD, FACS' },
    ],
    previewSvg: `
      <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #ffffff; border: 1px solid #e2e8f0; display: block; margin: 0 auto 6px;">
        <rect x="0" y="0" width="160" height="20" fill="#0f766e" rx="3"/>
        <rect x="8" y="6" width="70" height="8" fill="#ffffff" rx="2"/>
        <rect x="8" y="27" width="144" height="20" fill="#f0fdfa" stroke="#99f6e4" rx="2"/>
        <rect x="8" y="52" width="144" height="22" fill="#f8fafc" stroke="#cbd5e1" rx="2"/>
        <rect x="12" y="56" width="30" height="3" fill="#0d9488"/>
        <rect x="8" y="78" width="144" height="15" fill="#f0fdf4" rx="2"/>
      </svg>
    `,
    defaultHtml: `
      <div class="doc-page discharge-container" style="max-width: 800px; margin: 0 auto; padding: 35px; background: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f766e; padding-bottom: 14px; margin-bottom: 20px;">
          <div>
            <h2 style="margin: 0; color: #0f766e; font-size: 22px; font-weight: 800;">VALLEY GENERAL HOSPITAL</h2>
            <p style="margin: 3px 0 0 0; font-size: 12px; color: #64748b;">Department of Surgery & Inpatient Services</p>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            Discharge Status: Stable / Routine<br>
            Record Ref: DS-2026-992
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 18px;">
          <h3 style="margin: 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; font-weight: 800;">CLINICAL DISCHARGE SUMMARY</h3>
        </div>

        <div style="background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 6px; padding: 14px; margin-bottom: 20px; font-size: 13px;">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            <div><strong style="color: #0f766e;">Patient:</strong> {{patient.name}}</div>
            <div><strong style="color: #0f766e;">MRN:</strong> {{patient.mrn}}</div>
            <div><strong style="color: #0f766e;">Attending MD:</strong> {{doctor.name}}</div>
            <div><strong style="color: #0f766e;">Admission:</strong> {{admission_date}}</div>
            <div><strong style="color: #0f766e;">Discharge:</strong> {{discharge_date}}</div>
            <div><strong style="color: #0f766e;">Length of Stay:</strong> 6 Days</div>
          </div>
        </div>

        <div style="margin-bottom: 18px; font-size: 13px;">
          <h4 style="margin: 0 0 6px 0; color: #0f766e; text-transform: uppercase; font-size: 12px; font-weight: 700;">Final Primary Diagnosis</h4>
          <p style="margin: 0; background: #f8fafc; padding: 10px; border-radius: 4px; border: 1px solid #e2e8f0;">{{diagnosis}}</p>
        </div>

        <!-- Discharge Medications Table -->
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px 0; color: #0f766e; text-transform: uppercase; font-size: 12px; font-weight: 700;">Discharge Medications</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #0f766e; color: #ffffff; text-align: left;">
                <th style="padding: 8px;">Medication</th>
                <th style="padding: 8px;">Dosage</th>
                <th style="padding: 8px;">Frequency</th>
                <th style="padding: 8px;">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; font-weight: 600;">Amoxicillin/Clavulanate</td>
                <td style="padding: 8px;">875/125 mg</td>
                <td style="padding: 8px;">Twice daily (PO)</td>
                <td style="padding: 8px;">7 days</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; font-weight: 600;">Acetaminophen</td>
                <td style="padding: 8px;">500 mg</td>
                <td style="padding: 8px;">Every 6 hrs PRN pain</td>
                <td style="padding: 8px;">5 days</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px;">
          <div style="font-size: 11px; color: #64748b;">
            Follow-up: 10 days post-discharge in Surgical Clinic Room 4B.
          </div>
          <div style="text-align: center; border-top: 1px solid #475569; width: 220px; padding-top: 6px; font-size: 12px;">
            <strong>{{doctor.name}}</strong><br>
            <span style="color: #64748b; font-size: 11px;">Attending Surgeon Signature</span>
          </div>
        </div>
      </div>
    `,
  },

  // 4. Specialist Referral Letter
  {
    id: 'referral_letter',
    name: 'Specialist Referral & Consultation Request',
    shortName: 'Referral Letter',
    icon: 'fa fa-envelope-o',
    emoji: '✉️',
    category: 'clinical_documents',
    categoryLabel: 'Clinical Documents',
    documentTypeId: 'referral_letter',
    industry: 'healthcare',
    description: 'Formal medical referral letter from primary physician to specialist with patient summary, provisional diagnosis, and clinical request.',
    features: ['Letterhead Format', 'Clinical Summary', 'Investigation Results', 'Referral Reason', 'Urgency Badge'],
    tokens: [
      { key: 'referring_doctor', label: 'Referring Doctor', example: 'Dr. Emily Vance, MD' },
      { key: 'specialist_doctor', label: 'Consultant Specialist', example: 'Dr. Samuel Green, Cardiologist' },
      { key: 'patient.name', label: 'Patient Name', example: 'Arthur Pendelton' },
      { key: 'patient.mrn', label: 'MRN', example: 'MRN-332918' },
      { key: 'referral_reason', label: 'Reason for Referral', example: 'Echocardiogram evaluation for suspected aortic valve stenosis' },
    ],
    previewSvg: `
      <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #ffffff; border: 1px solid #e2e8f0; display: block; margin: 0 auto 6px;">
        <rect x="0" y="0" width="160" height="20" fill="#334155" rx="3"/>
        <rect x="8" y="6" width="60" height="8" fill="#ffffff" rx="2"/>
        <rect x="8" y="28" width="80" height="8" fill="#e2e8f0" rx="1"/>
        <rect x="8" y="42" width="144" height="30" fill="#f8fafc" stroke="#cbd5e1" rx="2"/>
        <rect x="8" y="78" width="60" height="14" fill="#f1f5f9" rx="2"/>
      </svg>
    `,
    defaultHtml: `
      <div class="doc-page referral-container" style="max-width: 800px; margin: 0 auto; padding: 40px; background: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <div style="border-bottom: 2px solid #334155; padding-bottom: 14px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="margin: 0; color: #1e293b; font-size: 20px; font-weight: 800;">FAMILY & PRIMARY CARE CLINIC</h2>
            <p style="margin: 3px 0 0 0; font-size: 12px; color: #64748b;">Medical Referral & Care Continuity</p>
          </div>
          <div style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700;">
            PRIORITY: ROUTINE
          </div>
        </div>

        <div style="margin-bottom: 20px; font-size: 13px; line-height: 1.6;">
          <p><strong>To:</strong> {{specialist_doctor}}<br>
          Department of Cardiology, Metro Medical Center</p>
          <p><strong>From:</strong> {{referring_doctor}}<br>
          Date: September 06, 2026</p>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 13px;">
          <strong>RE: Medical Referral for {{patient.name}} (DOB: 1968-11-22 | MRN: {{patient.mrn}})</strong>
        </div>

        <div style="font-size: 13px; line-height: 1.6; color: #334155;">
          <p>Dear Colleague,</p>
          <p>Thank you for seeing Mr. Pendelton for specialist cardiology consultation and transthoracic echocardiogram. He presented with exertional dyspnea and grade II systolic ejection murmur heard loudest at the right second intercostal space.</p>
          <p><strong>Clinical Reason for Referral:</strong><br>{{referral_reason}}</p>
          <p>Enclosed please find his baseline 12-lead ECG and routine serum chemistry panels. Please evaluate and initiate appropriate cardiological management.</p>
        </div>

        <div style="margin-top: 40px; font-size: 13px;">
          <p style="margin: 0 0 25px 0;">Warm regards,</p>
          <div style="border-top: 1px solid #475569; width: 220px; padding-top: 6px;">
            <strong>{{referring_doctor}}</strong><br>
            <span style="font-size: 11px; color: #64748b;">Family Medicine Physician</span>
          </div>
        </div>
      </div>
    `,
  },

  // 5. Dental Examination & Treatment Plan
  {
    id: 'dental_exam',
    name: 'Dental Examination & Treatment Plan',
    shortName: 'Dental Plan',
    icon: 'fa fa-smile-o',
    emoji: '🦷',
    category: 'dental',
    categoryLabel: 'Dental',
    documentTypeId: 'dental_examination',
    industry: 'dental',
    description: 'Comprehensive dental charting, periodontal evaluation, diagnosis of caries/gingivitis, and itemized dental treatment plan.',
    features: ['Odontogram Chart Grid', 'Periodontal Status', 'Itemized Treatment Table', 'Co-Payment Breakdown'],
    tokens: [
      { key: 'patient.name', label: 'Patient Name', example: 'Clara Oswald' },
      { key: 'dentist_name', label: 'Dentist / Surgeon', example: 'Dr. James Wilson, DDS' },
      { key: 'exam_date', label: 'Examination Date', example: '2026-09-06' },
      { key: 'total_estimate', label: 'Estimated Total', example: '$890.00' },
    ],
    previewSvg: `
      <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #ffffff; border: 1px solid #e2e8f0; display: block; margin: 0 auto 6px;">
        <rect x="0" y="0" width="160" height="20" fill="#0284c7" rx="3"/>
        <rect x="8" y="6" width="60" height="8" fill="#ffffff" rx="2"/>
        <rect x="8" y="27" width="144" height="20" fill="#f0f9ff" stroke="#bae6fd" rx="2"/>
        <circle cx="25" cy="37" r="4" fill="#0284c7"/>
        <circle cx="45" cy="37" r="4" fill="#0284c7"/>
        <circle cx="65" cy="37" r="4" fill="#0284c7"/>
        <rect x="8" y="53" width="144" height="24" fill="#f8fafc" stroke="#cbd5e1" rx="2"/>
        <rect x="8" y="82" width="70" height="12" fill="#e0f2fe" rx="2"/>
      </svg>
    `,
    defaultHtml: `
      <div class="doc-page dental-container" style="max-width: 800px; margin: 0 auto; padding: 35px; background: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 14px; margin-bottom: 20px;">
          <div>
            <h2 style="margin: 0; color: #0284c7; font-size: 22px; font-weight: 800;">APEX DENTAL & ORTHODONTIC CLINIC</h2>
            <p style="margin: 3px 0 0 0; font-size: 12px; color: #64748b;">Comprehensive Oral Examination & Restorative Dentistry</p>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            Date: {{exam_date}}<br>
            Dentist: {{dentist_name}}
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 18px;">
          <h3 style="margin: 0; font-size: 16px; text-transform: uppercase; color: #0f172a; font-weight: 800;">DENTAL EXAMINATION & TREATMENT PLAN</h3>
        </div>

        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 12px; margin-bottom: 20px; font-size: 13px;">
          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px;">
            <div><strong>Patient:</strong> {{patient.name}}</div>
            <div><strong>Chart No:</strong> DNT-5509</div>
            <div><strong>Recall:</strong> 6 Months</div>
          </div>
        </div>

        <!-- Tooth Charting Overview -->
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px 0; color: #0284c7; font-size: 12px; text-transform: uppercase; font-weight: 700;">Clinical Oral Findings</h4>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 12px; text-align: center;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 4px;">
              <span style="color: #64748b; font-size: 11px; display: block;">Periodontal Status</span>
              <strong style="color: #0f172a;">Gingivitis (Mild)</strong>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 4px;">
              <span style="color: #64748b; font-size: 11px; display: block;">Caries Detected</span>
              <strong style="color: #dc2626;">#19 (MO), #30 (O)</strong>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 4px;">
              <span style="color: #64748b; font-size: 11px; display: block;">Calculus / Tartar</span>
              <strong style="color: #d97706;">Moderate (Lower)</strong>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 4px;">
              <span style="color: #64748b; font-size: 11px; display: block;">Occlusion</span>
              <strong style="color: #16a34a;">Class I Normal</strong>
            </div>
          </div>
        </div>

        <!-- Proposed Treatment Plan Table -->
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px 0; color: #0284c7; font-size: 12px; text-transform: uppercase; font-weight: 700;">Proposed Treatment Schedule</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #0284c7; color: #ffffff; text-align: left;">
                <th style="padding: 8px;">Tooth / Area</th>
                <th style="padding: 8px;">Procedure Description</th>
                <th style="padding: 8px;">Priority</th>
                <th style="padding: 8px; text-align: right;">Fee</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; font-weight: 600;">Full Mouth</td>
                <td style="padding: 8px;">Ultrasonic Scaling & Dental Prophylaxis</td>
                <td style="padding: 8px;"><span style="background: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 3px; font-size: 10px;">Primary</span></td>
                <td style="padding: 8px; text-align: right;">$140.00</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; font-weight: 600;">#19</td>
                <td style="padding: 8px;">Composite Resin Restoration (2 Surfaces)</td>
                <td style="padding: 8px;"><span style="background: #fee2e2; color: #b91c1c; padding: 2px 6px; border-radius: 3px; font-size: 10px;">High</span></td>
                <td style="padding: 8px; text-align: right;">$280.00</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; font-weight: 600;">#30</td>
                <td style="padding: 8px;">Composite Resin Restoration (1 Surface)</td>
                <td style="padding: 8px;"><span style="background: #fee2e2; color: #b91c1c; padding: 2px 6px; border-radius: 3px; font-size: 10px;">High</span></td>
                <td style="padding: 8px; text-align: right;">$210.00</td>
              </tr>
              <tr style="background: #f8fafc; font-weight: 700;">
                <td colspan="3" style="padding: 8px; text-align: right;">Estimated Total:</td>
                <td style="padding: 8px; text-align: right; color: #0284c7; font-size: 14px;">{{total_estimate}}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px;">
          <div style="font-size: 11px; color: #64748b; max-width: 400px;">
            Treatment estimates are valid for 60 days. Insurance coverage may adjust final patient portion.
          </div>
          <div style="text-align: center; border-top: 1px solid #475569; width: 200px; padding-top: 6px; font-size: 12px;">
            <strong>{{dentist_name}}</strong><br>
            <span style="font-size: 11px; color: #64748b;">Licensed Dental Surgeon</span>
          </div>
        </div>
      </div>
    `,
  },

  // 6. Physiotherapy Assessment & Rehab Plan
  {
    id: 'physio_assessment',
    name: 'Physiotherapy Assessment & Rehab Plan',
    shortName: 'Physio Plan',
    icon: 'fa fa-heartbeat',
    emoji: '🏃',
    category: 'physiotherapy',
    categoryLabel: 'Physiotherapy',
    documentTypeId: 'physio_initial_assessment',
    industry: 'physiotherapy',
    description: 'Musculoskeletal and neurological physical therapy assessment, range of motion (ROM), VAS pain scoring, and prescribed rehab exercise regime.',
    features: ['Pain VAS Scale', 'ROM Mobility Matrix', 'Functional Rehabilitation Goals', 'Exercise Regimen'],
    tokens: [
      { key: 'patient.name', label: 'Patient Name', example: 'Nathan Drake' },
      { key: 'therapist_name', label: 'Physical Therapist', example: 'Laura Croft, DPT' },
      { key: 'affected_region', label: 'Affected Anatomy', example: 'Right Shoulder / Rotator Cuff' },
      { key: 'pain_score', label: 'VAS Pain Score', example: '6 / 10' },
    ],
    previewSvg: `
      <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #ffffff; border: 1px solid #e2e8f0; display: block; margin: 0 auto 6px;">
        <rect x="0" y="0" width="160" height="20" fill="#7c3aed" rx="3"/>
        <rect x="8" y="6" width="60" height="8" fill="#ffffff" rx="2"/>
        <rect x="8" y="27" width="144" height="20" fill="#f5f3ff" stroke="#ddd6fe" rx="2"/>
        <rect x="8" y="52" width="68" height="22" fill="#f8fafc" stroke="#cbd5e1" rx="2"/>
        <rect x="84" y="52" width="68" height="22" fill="#f8fafc" stroke="#cbd5e1" rx="2"/>
        <rect x="8" y="78" width="144" height="15" fill="#f5f3ff" rx="2"/>
      </svg>
    `,
    defaultHtml: `
      <div class="doc-page physio-container" style="max-width: 800px; margin: 0 auto; padding: 35px; background: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #7c3aed; padding-bottom: 14px; margin-bottom: 20px;">
          <div>
            <h2 style="margin: 0; color: #7c3aed; font-size: 22px; font-weight: 800;">ACTIVE MOTION PHYSIOTHERAPY</h2>
            <p style="margin: 3px 0 0 0; font-size: 12px; color: #64748b;">Orthopedic Rehabilitation & Sports Physical Therapy</p>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            Physical Therapist: {{therapist_name}}<br>
            Evaluation Date: Sep 06, 2026
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 18px;">
          <h3 style="margin: 0; font-size: 16px; text-transform: uppercase; color: #0f172a; font-weight: 800;">INITIAL PHYSIOTHERAPY ASSESSMENT & REHABILITATION PLAN</h3>
        </div>

        <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 6px; padding: 12px; margin-bottom: 20px; font-size: 13px;">
          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px;">
            <div><strong>Patient:</strong> {{patient.name}}</div>
            <div><strong>Injury Area:</strong> {{affected_region}}</div>
            <div><strong>Pain VAS:</strong> <span style="color: #7c3aed; font-weight: 800;">{{pain_score}}</span></div>
          </div>
        </div>

        <!-- Mobility & ROM Grid -->
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px 0; color: #7c3aed; font-size: 12px; text-transform: uppercase; font-weight: 700;">Range of Motion (ROM) & Strength</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #7c3aed; color: #ffffff; text-align: left;">
                <th style="padding: 8px;">Joint Movement</th>
                <th style="padding: 8px;">Active ROM</th>
                <th style="padding: 8px;">Normal Ref</th>
                <th style="padding: 8px;">Strength (MMT)</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; font-weight: 600;">Shoulder Flexion</td>
                <td style="padding: 8px; color: #dc2626;">125° (Pain at end-range)</td>
                <td style="padding: 8px;">180°</td>
                <td style="padding: 8px;">4- / 5</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; font-weight: 600;">Shoulder Abduction</td>
                <td style="padding: 8px; color: #dc2626;">110°</td>
                <td style="padding: 8px;">180°</td>
                <td style="padding: 8px;">3+ / 5</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; font-weight: 600;">External Rotation</td>
                <td style="padding: 8px;">60°</td>
                <td style="padding: 8px;">90°</td>
                <td style="padding: 8px;">4 / 5</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Prescribed Exercise Therapy -->
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px 0; color: #7c3aed; font-size: 12px; text-transform: uppercase; font-weight: 700;">Prescribed Rehabilitation Plan</h4>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 12px; line-height: 1.6;">
            <div><strong>Phase 1 Goals:</strong> Reduce inflammation, restore active flexion to 160°, eliminate sleep disturbance.</div>
            <div><strong>Frequency:</strong> 3x weekly in-clinic sessions + Daily Home Exercise Program (HEP).</div>
            <div><strong>Prescribed Exercises:</strong> Pendulum swings, Scapular retractions (3x15), Sleeper stretch, Band external rotations.</div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px;">
          <div style="font-size: 11px; color: #64748b;">
            Re-evaluation scheduled after 4 weeks (12 completed sessions).
          </div>
          <div style="text-align: center; border-top: 1px solid #475569; width: 220px; padding-top: 6px; font-size: 12px;">
            <strong>{{therapist_name}}</strong><br>
            <span style="font-size: 11px; color: #64748b;">Licensed Physical Therapist, DPT</span>
          </div>
        </div>
      </div>
    `,
  },

  // 7. Diagnostic Laboratory Report
  {
    id: 'lab_report',
    name: 'Diagnostic Laboratory Pathology Report',
    shortName: 'Lab Report',
    icon: 'fa fa-flask',
    emoji: '🧪',
    category: 'laboratory',
    categoryLabel: 'Laboratory',
    documentTypeId: 'laboratory_report',
    industry: 'laboratory',
    description: 'Pathology and diagnostic clinical report with test panels, specimen metadata, reference intervals, and flagged abnormal values.',
    features: ['Specimen Metadata', 'Panel Test Table', 'Reference Range Flags', 'Pathologist Verification'],
    tokens: [
      { key: 'patient.name', label: 'Patient Name', example: 'Julia Roberts' },
      { key: 'patient.mrn', label: 'MRN / UHID', example: 'MRN-190284' },
      { key: 'sample_id', label: 'Specimen Barcode ID', example: 'SPEC-99210' },
      { key: 'pathologist_name', label: 'Reporting Pathologist', example: 'Dr. Alan Harper, MD, FCAP' },
    ],
    previewSvg: `
      <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #ffffff; border: 1px solid #e2e8f0; display: block; margin: 0 auto 6px;">
        <rect x="0" y="0" width="160" height="20" fill="#d97706" rx="3"/>
        <rect x="8" y="6" width="60" height="8" fill="#ffffff" rx="2"/>
        <rect x="8" y="27" width="144" height="20" fill="#fffbeb" stroke="#fde68a" rx="2"/>
        <rect x="8" y="52" width="144" height="25" fill="#f8fafc" stroke="#cbd5e1" rx="2"/>
        <rect x="12" y="56" width="40" height="3" fill="#b45309"/>
        <rect x="120" y="56" width="25" height="3" fill="#dc2626"/>
        <rect x="8" y="80" width="80" height="12" fill="#fef3c7" rx="2"/>
      </svg>
    `,
    defaultHtml: `
      <div class="doc-page lab-container" style="max-width: 800px; margin: 0 auto; padding: 35px; background: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #d97706; padding-bottom: 14px; margin-bottom: 20px;">
          <div>
            <h2 style="margin: 0; color: #d97706; font-size: 22px; font-weight: 800;">PRECISION DIAGNOSTICS & PATHOLOGY LAB</h2>
            <p style="margin: 3px 0 0 0; font-size: 12px; color: #64748b;">CAP & CLIA Accredited Diagnostic Laboratory</p>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            Specimen ID: {{sample_id}}<br>
            Collected: Sep 06, 2026 | 08:15 AM
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 18px;">
          <h3 style="margin: 0; font-size: 16px; text-transform: uppercase; color: #0f172a; font-weight: 800;">COMPREHENSIVE METABOLIC & HEMATOLOGY PANEL</h3>
        </div>

        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 12px; margin-bottom: 20px; font-size: 13px;">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            <div><strong>Patient:</strong> {{patient.name}}</div>
            <div><strong>MRN:</strong> {{patient.mrn}}</div>
            <div><strong>Sample Type:</strong> Serum & Whole Blood</div>
          </div>
        </div>

        <!-- Results Table -->
        <div style="margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #d97706; color: #ffffff; text-align: left;">
                <th style="padding: 8px;">Test Parameter</th>
                <th style="padding: 8px;">Observed Value</th>
                <th style="padding: 8px;">Reference Range</th>
                <th style="padding: 8px;">Units</th>
                <th style="padding: 8px; text-align: center;">Flag</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; font-weight: 600;">Fasting Blood Glucose</td>
                <td style="padding: 8px; font-weight: 700; color: #dc2626;">128</td>
                <td style="padding: 8px;">70 - 99</td>
                <td style="padding: 8px;">mg/dL</td>
                <td style="padding: 8px; text-align: center;"><span style="background: #fee2e2; color: #b91c1c; padding: 2px 6px; border-radius: 3px; font-weight: 700; font-size: 10px;">HIGH</span></td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; font-weight: 600;">Hemoglobin A1c</td>
                <td style="padding: 8px; font-weight: 700; color: #dc2626;">6.7</td>
                <td style="padding: 8px;">4.0 - 5.6</td>
                <td style="padding: 8px;">%</td>
                <td style="padding: 8px; text-align: center;"><span style="background: #fee2e2; color: #b91c1c; padding: 2px 6px; border-radius: 3px; font-weight: 700; font-size: 10px;">HIGH</span></td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; font-weight: 600;">Serum Creatinine</td>
                <td style="padding: 8px; font-weight: 600;">0.92</td>
                <td style="padding: 8px;">0.70 - 1.30</td>
                <td style="padding: 8px;">mg/dL</td>
                <td style="padding: 8px; text-align: center;"><span style="color: #16a34a; font-weight: 700;">NORMAL</span></td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; font-weight: 600;">Total Cholesterol</td>
                <td style="padding: 8px; font-weight: 700; color: #d97706;">212</td>
                <td style="padding: 8px;">< 200</td>
                <td style="padding: 8px;">mg/dL</td>
                <td style="padding: 8px; text-align: center;"><span style="background: #fef3c7; color: #b45309; padding: 2px 6px; border-radius: 3px; font-weight: 700; font-size: 10px;">BORDERLINE</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px;">
          <div style="font-size: 11px; color: #64748b; max-width: 420px;">
            Results released electronically. Flagged values indicate parameters outside statistical reference intervals.
          </div>
          <div style="text-align: center; border-top: 1px solid #475569; width: 220px; padding-top: 6px; font-size: 12px;">
            <strong>{{pathologist_name}}</strong><br>
            <span style="font-size: 11px; color: #64748b;">Consultant Pathologist, MD</span>
          </div>
        </div>
      </div>
    `,
  },

  // 8. Medical Invoice & Billing Statement
  {
    id: 'medical_invoice',
    name: 'Medical Invoice & Billing Statement',
    shortName: 'Medical Invoice',
    icon: 'fa fa-file-text-o',
    emoji: '🧾',
    category: 'administrative',
    categoryLabel: 'Administrative',
    documentTypeId: 'admin_invoice',
    industry: 'healthcare',
    description: 'Clinical billing invoice with consultation, surgical, pharmacy, and diagnostic line items, insurance copay deduction, and online payment details.',
    features: ['Itemized Medical Services', 'Insurance Copay Logic', 'Tax & Deductions', 'Payment Instructions'],
    tokens: [
      { key: 'invoice_number', label: 'Invoice No', example: 'MED-INV-2026-441' },
      { key: 'patient.name', label: 'Patient Name', example: 'Arthur Pendelton' },
      { key: 'patient.mrn', label: 'MRN', example: 'MRN-332918' },
      { key: 'service_date', label: 'Service Date', example: '2026-09-05' },
      { key: 'total_amount', label: 'Total Due', example: '$340.00' },
    ],
    previewSvg: `
      <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #ffffff; border: 1px solid #e2e8f0; display: block; margin: 0 auto 6px;">
        <rect x="0" y="0" width="160" height="20" fill="#059669" rx="3"/>
        <rect x="8" y="6" width="60" height="8" fill="#ffffff" rx="2"/>
        <rect x="8" y="27" width="144" height="20" fill="#ecfdf5" stroke="#a7f3d0" rx="2"/>
        <rect x="8" y="52" width="144" height="25" fill="#f8fafc" stroke="#cbd5e1" rx="2"/>
        <rect x="90" y="80" width="62" height="14" fill="#059669" rx="2"/>
      </svg>
    `,
    defaultHtml: `
      <div class="doc-page medical-inv-container" style="max-width: 800px; margin: 0 auto; padding: 35px; background: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 22px;">
          <div>
            <h2 style="margin: 0; color: #059669; font-size: 22px; font-weight: 800;">METRO HEALTH CLINIC BILLING</h2>
            <p style="margin: 3px 0 0 0; font-size: 12px; color: #64748b;">Patient Billing & Accounts Receivable</p>
          </div>
          <div style="text-align: right; font-size: 12px;">
            <strong style="font-size: 16px; color: #0f172a;">STATEMENT</strong><br>
            <span style="color: #64748b;">Invoice #: {{invoice_number}}</span><br>
            <span style="color: #64748b;">Date: {{service_date}}</span>
          </div>
        </div>

        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 12px; margin-bottom: 20px; font-size: 13px;">
          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px;">
            <div><strong>Patient Name:</strong> {{patient.name}}</div>
            <div><strong>MRN / ID:</strong> {{patient.mrn}}</div>
            <div><strong>Due Date:</strong> Due Upon Receipt</div>
          </div>
        </div>

        <!-- Medical Services Line Items -->
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #059669; color: #ffffff; text-align: left;">
              <th style="padding: 8px;">Service / Procedure Code</th>
              <th style="padding: 8px;">Description</th>
              <th style="padding: 8px; text-align: right;">Gross Fee</th>
              <th style="padding: 8px; text-align: right;">Insurance Paid</th>
              <th style="padding: 8px; text-align: right;">Patient Due</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px; font-weight: 600;">CPT 99214</td>
              <td style="padding: 8px;">Office Consultation (Level 4)</td>
              <td style="padding: 8px; text-align: right;">$220.00</td>
              <td style="padding: 8px; text-align: right;">$180.00</td>
              <td style="padding: 8px; text-align: right; font-weight: 600;">$40.00</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px; font-weight: 600;">CPT 80053</td>
              <td style="padding: 8px;">Comprehensive Metabolic Panel (CMP)</td>
              <td style="padding: 8px; text-align: right;">$160.00</td>
              <td style="padding: 8px; text-align: right;">$120.00</td>
              <td style="padding: 8px; text-align: right; font-weight: 600;">$40.00</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px; font-weight: 600;">CPT 93306</td>
              <td style="padding: 8px;">Transthoracic Echocardiogram (TTE)</td>
              <td style="padding: 8px; text-align: right;">$950.00</td>
              <td style="padding: 8px; text-align: right;">$690.00</td>
              <td style="padding: 8px; text-align: right; font-weight: 600;">$260.00</td>
            </tr>
            <tr style="background: #f8fafc; font-weight: 700;">
              <td colspan="4" style="padding: 10px; text-align: right; font-size: 13px;">Total Patient Responsibility:</td>
              <td style="padding: 10px; text-align: right; color: #059669; font-size: 16px;">{{total_amount}}</td>
            </tr>
          </tbody>
        </table>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 12px;">
          <strong>Payment Options:</strong> Pay online at <em>metrohealth.org/pay</em> with Invoice # {{invoice_number}}, or call Billing Services at +1 (800) 555-0199.
        </div>
      </div>
    `,
  },
];
