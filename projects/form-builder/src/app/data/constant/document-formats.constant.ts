import { DocumentCategory, DocumentFormat } from '../model/document-formats.model';
import { HEALTHCARE_DOCUMENT_FORMATS } from './healthcare-formats.constant';

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  { id: 'all', label: 'All Templates', icon: 'fa fa-th-large' },
  { id: 'patient_forms', label: 'Patient Forms', icon: 'fa fa-id-card-o', industry: 'healthcare', badgeColor: '#2563eb' },
  { id: 'clinical_documents', label: 'Clinical Documents', icon: 'fa fa-stethoscope', industry: 'healthcare', badgeColor: '#0f766e' },
  { id: 'dental', label: 'Dental', icon: 'fa fa-smile-o', industry: 'dental', badgeColor: '#0284c7' },
  { id: 'physiotherapy', label: 'Physiotherapy', icon: 'fa fa-heartbeat', industry: 'physiotherapy', badgeColor: '#7c3aed' },
  { id: 'laboratory', label: 'Laboratory', icon: 'fa fa-flask', industry: 'laboratory', badgeColor: '#d97706' },
  { id: 'administrative', label: 'Administrative', icon: 'fa fa-file-text-o', industry: 'administrative', badgeColor: '#059669' },
];

export const DOCUMENT_FORMATS: DocumentFormat[] = [
  ...HEALTHCARE_DOCUMENT_FORMATS,
  // 1. 🧾 INVOICE / BILL
  {
    id: 'invoice',
    name: 'Invoice / Bill',
    shortName: 'Invoice',
    icon: 'fa fa-file-text-o',
    emoji: '🧾',
    category: 'finance',
    categoryLabel: 'Finance & Billing',
    description: 'Itemized commercial invoice with company header, client billing details, line items table, tax calculations, and payment terms.',
    features: ['Line Items Table', 'Auto Tax Calculation', 'Bank / UPI Details', 'Due Date & Terms'],
    tokens: [
      { key: 'invoice_number', label: 'Invoice Number', example: 'INV-2026-0891' },
      { key: 'invoice_date', label: 'Invoice Date', example: '2026-09-05' },
      { key: 'due_date', label: 'Payment Due Date', example: '2026-10-05' },
      { key: 'client_name', label: 'Client / Company Name', example: 'Acme Global Corp' },
      { key: 'total_amount', label: 'Total Payable', example: '$4,850.00' },
    ],
    previewSvg: `
      <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #ffffff; border: 1px solid #e2e8f0; display: block; margin: 0 auto 6px;">
        <rect x="0" y="0" width="160" height="22" fill="#0f172a" rx="3"/>
        <rect x="8" y="7" width="45" height="8" fill="#38bdf8" rx="2"/>
        <rect x="110" y="7" width="42" height="8" fill="#ffffff" rx="2"/>
        <rect x="8" y="30" width="60" height="5" fill="#64748b" rx="1"/>
        <rect x="8" y="38" width="45" height="4" fill="#94a3b8" rx="1"/>
        <rect x="95" y="30" width="57" height="5" fill="#64748b" rx="1"/>
        <rect x="8" y="50" width="144" height="25" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" rx="2"/>
        <line x1="8" y1="58" x2="152" y2="58" stroke="#cbd5e1" stroke-width="1"/>
        <rect x="12" y="53" width="20" height="3" fill="#475569"/>
        <rect x="70" y="53" width="15" height="3" fill="#475569"/>
        <rect x="125" y="53" width="20" height="3" fill="#475569"/>
        <rect x="95" y="82" width="57" height="12" fill="#22c55e" rx="2"/>
      </svg>
    `,
    defaultHtml: `
      <div class="doc-page invoice-container" style="max-width: 800px; margin: 0 auto; padding: 35px; background: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 25px;">
          <div>
            <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px;">INVOICE</h1>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Original for Recipient</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 20px; color: #2563eb; font-weight: 700;">Nova Solutions Inc.</h2>
            <p style="margin: 3px 0 0 0; font-size: 12px; color: #64748b;">100 Innovation Blvd, Suite 400<br>San Francisco, CA 94105<br>billing@novasolutions.com</p>
          </div>
        </div>

        <!-- Meta Grid -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 25px; font-size: 13px;">
          <div style="flex: 1; background: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; margin-right: 15px;">
            <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700; margin-bottom: 6px;">Billed To</span>
            <strong style="font-size: 14px; color: #0f172a; display: block;">Apex Enterprise Corp</strong>
            <span style="color: #475569; display: block; margin-top: 3px;">Attn: Finance Department</span>
            <span style="color: #64748b; display: block;">742 Evergreen Terrace, Springfield, OR</span>
            <span style="color: #64748b; display: block;">VAT / Tax ID: US-98421045</span>
          </div>
          <div style="flex: 1; background: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 3px 0; color: #64748b; font-size: 12px;">Invoice #:</td>
                <td style="padding: 3px 0; text-align: right; font-weight: 700; color: #0f172a;">INV-2026-0891</td>
              </tr>
              <tr>
                <td style="padding: 3px 0; color: #64748b; font-size: 12px;">Issue Date:</td>
                <td style="padding: 3px 0; text-align: right; font-weight: 600;">Sep 05, 2026</td>
              </tr>
              <tr>
                <td style="padding: 3px 0; color: #64748b; font-size: 12px;">Due Date:</td>
                <td style="padding: 3px 0; text-align: right; font-weight: 600; color: #dc2626;">Oct 05, 2026</td>
              </tr>
              <tr>
                <td style="padding: 3px 0; color: #64748b; font-size: 12px;">PO Reference:</td>
                <td style="padding: 3px 0; text-align: right;">PO-99412</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Line Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px;">
          <thead>
            <tr style="background: #0f172a; color: #ffffff;">
              <th style="padding: 10px 12px; text-align: left; border-radius: 4px 0 0 4px;">#</th>
              <th style="padding: 10px 12px; text-align: left;">Description</th>
              <th style="padding: 10px 12px; text-align: center;">Qty</th>
              <th style="padding: 10px 12px; text-align: right;">Unit Price</th>
              <th style="padding: 10px 12px; text-align: right;">Tax %</th>
              <th style="padding: 10px 12px; text-align: right; border-radius: 0 4px 4px 0;">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px; color: #64748b;">1</td>
              <td style="padding: 12px;">
                <strong style="color: #0f172a;">Enterprise Cloud Infrastructure</strong>
                <span style="display: block; font-size: 11px; color: #64748b;">Monthly dedicated compute clusters & storage</span>
              </td>
              <td style="padding: 12px; text-align: center;">1</td>
              <td style="padding: 12px; text-align: right;">$2,400.00</td>
              <td style="padding: 12px; text-align: right;">10%</td>
              <td style="padding: 12px; text-align: right; font-weight: 600;">$2,400.00</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px; color: #64748b;">2</td>
              <td style="padding: 12px;">
                <strong style="color: #0f172a;">Custom Software Consulting & SLA</strong>
                <span style="display: block; font-size: 11px; color: #64748b;">Senior architecture support (20 hours)</span>
              </td>
              <td style="padding: 12px; text-align: center;">20</td>
              <td style="padding: 12px; text-align: right;">$100.00</td>
              <td style="padding: 12px; text-align: right;">10%</td>
              <td style="padding: 12px; text-align: right; font-weight: 600;">$2,000.00</td>
            </tr>
          </tbody>
        </table>

        <!-- Totals Summary & Payment Info -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px;">
          <div style="flex: 1; margin-right: 25px;">
            <div style="background: #f1f5f9; padding: 14px; border-radius: 6px; font-size: 12px; color: #475569;">
              <strong style="display: block; color: #0f172a; margin-bottom: 4px;">Payment Instructions:</strong>
              Bank: Chase Manhattan Bank<br>
              Account Name: Nova Solutions Inc.<br>
              Account / IBAN: US98 CHSE 0001 2345 6789<br>
              Swift / BIC: CHSEUS33XXX
            </div>
          </div>
          <div style="width: 280px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Subtotal:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 600;">$4,400.00</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Tax (10%):</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 600;">$440.00</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Discount (Promo):</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #16a34a;">-$50.00</td>
              </tr>
              <tr style="border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a;">
                <td style="padding: 10px 0; font-weight: 800; font-size: 15px; color: #0f172a;">TOTAL DUE:</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 800; font-size: 17px; color: #2563eb;">$4,790.00</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Footer Terms -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 11px; color: #94a3b8; text-align: center;">
          Thank you for your business! Payment is due within 30 days of invoice date. For billing inquiries, contact finance@novasolutions.com.
        </div>
      </div>
    `,
  },

  // 2. 📊 BUSINESS REPORT
  {
    id: 'business-report',
    name: 'Business Report',
    shortName: 'Report',
    icon: 'fa fa-bar-chart',
    emoji: '📊',
    category: 'corporate',
    categoryLabel: 'Corporate & HR',
    description: 'Executive quarterly business performance report with KPI metric cards, department overview, progress tables, and strategic recommendations.',
    features: ['Executive Summary', '4-KPI Metric Cards', 'Status Indicators', 'Strategic Recommendations'],
    tokens: [
      { key: 'report_title', label: 'Report Title', example: 'Q3 Business Performance Review' },
      { key: 'author_name', label: 'Prepared By', example: 'Strategy & Ops Team' },
      { key: 'reporting_period', label: 'Reporting Period', example: 'July - September 2026' },
      { key: 'key_metric_revenue', label: 'Total Revenue', example: '$1.42M (+18%)' },
    ],
    previewSvg: `
      <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #ffffff; border: 1px solid #e2e8f0; display: block; margin: 0 auto 6px;">
        <rect x="0" y="0" width="160" height="18" fill="#1e3a8a" rx="3"/>
        <rect x="8" y="5" width="70" height="8" fill="#ffffff" rx="2"/>
        <rect x="8" y="24" width="32" height="22" fill="#eff6ff" stroke="#bfdbfe" rx="2"/>
        <rect x="45" y="24" width="32" height="22" fill="#ecfdf5" stroke="#a7f3d0" rx="2"/>
        <rect x="82" y="24" width="32" height="22" fill="#fef3c7" stroke="#fde68a" rx="2"/>
        <rect x="119" y="24" width="33" height="22" fill="#faf5ff" stroke="#e9d5ff" rx="2"/>
        <rect x="8" y="52" width="144" height="20" fill="#f8fafc" stroke="#cbd5e1" rx="2"/>
        <line x1="8" y1="58" x2="152" y2="58" stroke="#cbd5e1"/>
        <rect x="8" y="78" width="144" height="14" fill="#f1f5f9" rx="2"/>
      </svg>
    `,
    defaultHtml: `
      <div class="doc-page report-container" style="max-width: 820px; margin: 0 auto; padding: 35px; background: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <!-- Header -->
        <div style="border-bottom: 3px solid #1e3a8a; padding-bottom: 18px; margin-bottom: 25px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: #2563eb; background: #dbeafe; padding: 4px 10px; border-radius: 20px;">EXECUTIVE BRIEFING</span>
            <span style="font-size: 12px; color: #64748b;">Published: September 2026</span>
          </div>
          <h1 style="margin: 12px 0 4px 0; font-size: 26px; color: #0f172a; font-weight: 800;">Quarterly Business Performance & Strategy Report</h1>
          <p style="margin: 0; font-size: 13px; color: #64748b;">Prepared by: Strategic Operations & Analytics Division | Period: Q3 Fiscal 2026</p>
        </div>

        <!-- Executive Summary -->
        <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 14px 18px; margin-bottom: 25px; border-radius: 0 6px 6px 0;">
          <strong style="display: block; font-size: 13px; color: #0f172a; margin-bottom: 4px;">Executive Summary</strong>
          <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
            During Q3 2026, enterprise gross revenue exceeded forecast targets by 14.8%, primarily driven by enterprise software subscriptions and regional partner expansion. Customer retention reached 94.2% while operational expenditure dropped by 3.4% through automation.
          </p>
        </div>

        <!-- KPI Metric Cards Grid -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 25px;">
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px; border-radius: 6px; text-align: center;">
            <span style="font-size: 11px; color: #166534; font-weight: 700; text-transform: uppercase;">Total Revenue</span>
            <h3 style="margin: 6px 0 2px 0; font-size: 20px; color: #15803d;">$2.48M</h3>
            <span style="font-size: 11px; color: #16a34a; font-weight: 600;">+14.8% YoY</span>
          </div>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 14px; border-radius: 6px; text-align: center;">
            <span style="font-size: 11px; color: #1e40af; font-weight: 700; text-transform: uppercase;">Active Clients</span>
            <h3 style="margin: 6px 0 2px 0; font-size: 20px; color: #1d4ed8;">1,240</h3>
            <span style="font-size: 11px; color: #2563eb; font-weight: 600;">+125 New</span>
          </div>
          <div style="background: #fefce8; border: 1px solid #fef08a; padding: 14px; border-radius: 6px; text-align: center;">
            <span style="font-size: 11px; color: #854d0e; font-weight: 700; text-transform: uppercase;">Retention Rate</span>
            <h3 style="margin: 6px 0 2px 0; font-size: 20px; color: #a16207;">94.2%</h3>
            <span style="font-size: 11px; color: #ca8a04; font-weight: 600;">Target: 92%</span>
          </div>
          <div style="background: #faf5ff; border: 1px solid #e9d5ff; padding: 14px; border-radius: 6px; text-align: center;">
            <span style="font-size: 11px; color: #6b21a8; font-weight: 700; text-transform: uppercase;">NPS Score</span>
            <h3 style="margin: 6px 0 2px 0; font-size: 20px; color: #7e22ce;">+68</h3>
            <span style="font-size: 11px; color: #9333ea; font-weight: 600;">Industry High</span>
          </div>
        </div>

        <!-- Department Performance Table -->
        <h3 style="font-size: 15px; color: #0f172a; margin: 0 0 10px 0; font-weight: 700;">Departmental Milestone Status</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 25px;">
          <thead>
            <tr style="background: #f1f5f9; color: #475569; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 10px 12px; text-align: left;">Department / Initiative</th>
              <th style="padding: 10px 12px; text-align: left;">Lead Owner</th>
              <th style="padding: 10px 12px; text-align: center;">Target Date</th>
              <th style="padding: 10px 12px; text-align: center;">Progress</th>
              <th style="padding: 10px 12px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 12px; font-weight: 600;">Global Cloud Migration Phase II</td>
              <td style="padding: 10px 12px; color: #64748b;">DevOps Team</td>
              <td style="padding: 10px 12px; text-align: center;">Oct 15, 2026</td>
              <td style="padding: 10px 12px; text-align: center;">90%</td>
              <td style="padding: 10px 12px; text-align: center;"><span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700;">ON TRACK</span></td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 12px; font-weight: 600;">EMEA Sales Channel Onboarding</td>
              <td style="padding: 10px 12px; color: #64748b;">Sales VP</td>
              <td style="padding: 10px 12px; text-align: center;">Nov 01, 2026</td>
              <td style="padding: 10px 12px; text-align: center;">75%</td>
              <td style="padding: 10px 12px; text-align: center;"><span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700;">ON TRACK</span></td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 12px; font-weight: 600;">ISO 27001 Security Re-certification</td>
              <td style="padding: 10px 12px; color: #64748b;">Compliance Lead</td>
              <td style="padding: 10px 12px; text-align: center;">Sep 30, 2026</td>
              <td style="padding: 10px 12px; text-align: center;">60%</td>
              <td style="padding: 10px 12px; text-align: center;"><span style="background: #fef9c3; color: #854d0e; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700;">IN REVIEW</span></td>
            </tr>
          </tbody>
        </table>

        <!-- Strategic Recommendations -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px;">
          <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #0f172a; font-weight: 700;">Key Strategic Recommendations for Q4</h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #475569; line-height: 1.6;">
            <li>Accelerate hiring for AI solution architects to meet enterprise backlog demands.</li>
            <li>Implement automated billing reconciliations to reduce accounts receivable cycle by 6 days.</li>
            <li>Maintain reserve cash allocation of 15% for international expansion initiatives.</li>
          </ul>
        </div>
      </div>
    `,
  },

  // 3. 🏥 MEDICAL / DOCTOR REPORT
  {
    id: 'medical-report',
    name: 'Medical / Doctor Report',
    shortName: 'Medical Report',
    icon: 'fa fa-user-md',
    emoji: '🏥',
    category: 'clinical_documents',
    categoryLabel: 'Clinical Documents',
    description: 'Comprehensive clinical consultation report with hospital letterhead, patient demographics, vitals, clinical observations, diagnosis, Rx prescription, and doctor signature.',
    features: ['Hospital Letterhead', 'Patient Vitals Grid', 'Clinical Findings & Rx', 'Doctor Signature & Stamp'],
    tokens: [
      { key: 'patient_name', label: 'Patient Name', example: 'Sarah Jenkins' },
      { key: 'patient_id', label: 'Patient MRN / UHID', example: 'MRN-884912' },
      { key: 'doctor_name', label: 'Doctor Name', example: 'Dr. Robert Chen, MD' },
      { key: 'diagnosis', label: 'Primary Diagnosis', example: 'Acute Bronchitis (J20.9)' },
    ],
    previewSvg: `
      <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #ffffff; border: 1px solid #e2e8f0; display: block; margin: 0 auto 6px;">
        <rect x="0" y="0" width="160" height="20" fill="#0284c7" rx="3"/>
        <circle cx="15" cy="10" r="6" fill="#ffffff"/>
        <rect x="25" y="6" width="60" height="8" fill="#ffffff" rx="2"/>
        <rect x="8" y="27" width="144" height="18" fill="#f0f9ff" stroke="#bae6fd" rx="2"/>
        <rect x="8" y="50" width="68" height="20" fill="#f8fafc" stroke="#cbd5e1" rx="2"/>
        <rect x="84" y="50" width="68" height="20" fill="#f8fafc" stroke="#cbd5e1" rx="2"/>
        <rect x="8" y="75" width="144" height="18" fill="#f0fdf4" stroke="#bbf7d0" rx="2"/>
      </svg>
    `,
    defaultHtml: `
      <div class="doc-page medical-container" style="max-width: 800px; margin: 0 auto; padding: 35px; background: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <!-- Letterhead -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px;">
          <div>
            <h2 style="margin: 0; color: #0284c7; font-size: 22px; font-weight: 800;">METRO HEALTHCARE HOSPITAL</h2>
            <p style="margin: 3px 0 0 0; font-size: 12px; color: #64748b;">Department of Internal & Specialty Medicine | NABH Accredited</p>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            Emergency Helpline: +1 (800) 555-0199<br>
            450 Medical Center Parkway, Suite 300<br>
            contact@metrohealth.org
          </div>
        </div>

        <!-- Title -->
        <div style="text-align: center; margin-bottom: 20px;">
          <h3 style="margin: 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; font-weight: 800;">CLINICAL CONSULTATION & DIAGNOSTIC REPORT</h3>
        </div>

        <!-- Patient Demographics Banner -->
        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 14px; margin-bottom: 20px; font-size: 13px;">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            <div><strong style="color: #0369a1;">Patient:</strong> Sarah Jenkins</div>
            <div><strong style="color: #0369a1;">UHID / MRN:</strong> MRN-884912</div>
            <div><strong style="color: #0369a1;">Date & Time:</strong> Sep 05, 2026 | 10:30 AM</div>
            <div><strong style="color: #0369a1;">Age / Sex:</strong> 34 Yrs / Female</div>
            <div><strong style="color: #0369a1;">Consulting Doctor:</strong> Dr. Robert Chen, MD</div>
            <div><strong style="color: #0369a1;">Dept:</strong> Pulmonology & Internal Med</div>
          </div>
        </div>

        <!-- Vitals Grid -->
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #0f172a; font-weight: 700; text-transform: uppercase;">Recorded Vital Signs</h4>
          <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; text-align: center;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 5px;">
              <span style="font-size: 11px; color: #64748b; display: block;">Blood Pressure</span>
              <strong style="font-size: 14px; color: #0f172a;">120/78 mmHg</strong>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 5px;">
              <span style="font-size: 11px; color: #64748b; display: block;">Pulse Rate</span>
              <strong style="font-size: 14px; color: #0f172a;">74 bpm</strong>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 5px;">
              <span style="font-size: 11px; color: #64748b; display: block;">Temperature</span>
              <strong style="font-size: 14px; color: #0f172a;">98.6 °F</strong>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 5px;">
              <span style="font-size: 11px; color: #64748b; display: block;">SpO2</span>
              <strong style="font-size: 14px; color: #16a34a;">99%</strong>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 5px;">
              <span style="font-size: 11px; color: #64748b; display: block;">BMI</span>
              <strong style="font-size: 14px; color: #0f172a;">22.4 kg/m²</strong>
            </div>
          </div>
        </div>

        <!-- Clinical Findings & Diagnosis -->
        <div style="margin-bottom: 20px; font-size: 13px; line-height: 1.5;">
          <div style="margin-bottom: 12px;">
            <strong style="color: #0f172a;">Chief Complaints:</strong>
            <p style="margin: 2px 0 0 0; color: #475569;">Persistent productive cough with mild chest tightness for 4 days. No fever or shortness of breath on exertion.</p>
          </div>
          <div style="margin-bottom: 12px;">
            <strong style="color: #0f172a;">Primary Diagnosis:</strong>
            <p style="margin: 2px 0 0 0; color: #dc2626; font-weight: 600;">Acute Viral Bronchitis (ICD-10: J20.9)</p>
          </div>
        </div>

        <!-- Rx Prescription List -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
          <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #0284c7; font-weight: 800;">Rx - MEDICAL PRESCRIPTION</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="border-bottom: 1px solid #cbd5e1; color: #64748b;">
                <th style="padding: 6px 0; text-align: left;">Medication / Dosage</th>
                <th style="padding: 6px 0; text-align: center;">Frequency</th>
                <th style="padding: 6px 0; text-align: center;">Duration</th>
                <th style="padding: 6px 0; text-align: left;">Instructions</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; font-weight: 600;">Amoxicillin / Clavulanate 625mg</td>
                <td style="padding: 8px 0; text-align: center;">1 - 0 - 1</td>
                <td style="padding: 8px 0; text-align: center;">5 Days</td>
                <td style="padding: 8px 0;">Post meals with water</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; font-weight: 600;">Levocetirizine 5mg</td>
                <td style="padding: 8px 0; text-align: center;">0 - 0 - 1</td>
                <td style="padding: 8px 0; text-align: center;">5 Days</td>
                <td style="padding: 8px 0;">At bedtime</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Guaifenesin Expectorant Syrup 100ml</td>
                <td style="padding: 8px 0; text-align: center;">1 tsp tid</td>
                <td style="padding: 8px 0; text-align: center;">5 Days</td>
                <td style="padding: 8px 0;">After food</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Doctor Signature & Stamp -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 10px;">
          <div style="font-size: 11px; color: #64748b;">
            Next Review: Sep 12, 2026 (7 days)<br>
            Please report to emergency if breathing difficulty worsens.
          </div>
          <div style="text-align: center; border-top: 1px dashed #94a3b8; padding-top: 6px; width: 200px;">
            <strong style="display: block; font-size: 13px; color: #0f172a;">Dr. Robert Chen, MD</strong>
            <span style="font-size: 11px; color: #64748b;">Reg No: MED-94104</span>
            <span style="font-size: 10px; color: #94a3b8; display: block; margin-top: 2px;">Consultant Pulmonologist</span>
          </div>
        </div>
      </div>
    `,
  },

  // 4. 📋 QUOTATION / ESTIMATE
  {
    id: 'quotation',
    name: 'Quotation / Estimate',
    shortName: 'Quotation',
    icon: 'fa fa-calculator',
    emoji: '📋',
    category: 'finance',
    categoryLabel: 'Finance & Billing',
    description: 'Commercial sales quotation and price estimate with itemized deliverables, discount schedules, terms of validity, and formal client acceptance section.',
    features: ['Deliverables Breakdown', 'Price Estimate Table', 'Validity & Terms', 'Client Acceptance Box'],
    tokens: [
      { key: 'quote_number', label: 'Quote Number', example: 'QT-2026-0428' },
      { key: 'valid_until', label: 'Validity Period', example: '30 Days from Issue' },
      { key: 'client_name', label: 'Prospective Client', example: 'Horizon Media Group' },
      { key: 'grand_total', label: 'Estimated Total', example: '$12,500.00' },
    ],
    previewSvg: `
      <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #ffffff; border: 1px solid #e2e8f0; display: block; margin: 0 auto 6px;">
        <rect x="0" y="0" width="160" height="20" fill="#0d9488" rx="3"/>
        <rect x="8" y="6" width="55" height="8" fill="#ffffff" rx="2"/>
        <rect x="8" y="27" width="144" height="15" fill="#f0fdfa" stroke="#99f6e4" rx="2"/>
        <rect x="8" y="47" width="144" height="28" fill="#f8fafc" stroke="#cbd5e1" rx="2"/>
        <line x1="8" y1="55" x2="152" y2="55" stroke="#cbd5e1"/>
        <rect x="95" y="80" width="57" height="14" fill="#0d9488" rx="2"/>
      </svg>
    `,
    defaultHtml: `
      <div class="doc-page quotation-container" style="max-width: 800px; margin: 0 auto; padding: 35px; background: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #0d9488; padding-bottom: 18px; margin-bottom: 20px;">
          <div>
            <h1 style="margin: 0; font-size: 24px; color: #0d9488; font-weight: 800;">PRICE QUOTATION</h1>
            <p style="margin: 3px 0 0 0; font-size: 13px; color: #64748b;">Formal Project Estimate & Scope</p>
          </div>
          <div style="text-align: right; font-size: 12px; color: #64748b;">
            <strong style="color: #0f172a; font-size: 14px; display: block;">Quantum Agency Inc.</strong>
            250 Market Street, Suite 500<br>San Francisco, CA 94102<br>sales@quantumagency.com
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px;">
          <div style="flex: 1; background: #f0fdfa; padding: 12px 15px; border-radius: 6px; border: 1px solid #ccfbf1; margin-right: 15px;">
            <strong style="color: #0f766e; display: block; margin-bottom: 4px;">Quotation Prepared For:</strong>
            <span style="font-weight: 700; color: #0f172a; display: block;">Horizon Media Group</span>
            <span style="color: #475569;">Attn: Sarah Sterling, Chief Product Officer</span><br>
            <span style="color: #64748b;">Email: s.sterling@horizonmedia.com</span>
          </div>
          <div style="flex: 1; background: #f8fafc; padding: 12px 15px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="color: #64748b;">Quote Reference:</td><td style="text-align: right; font-weight: 700;">QT-2026-0428</td></tr>
              <tr><td style="color: #64748b;">Date Issued:</td><td style="text-align: right; font-weight: 600;">Sep 05, 2026</td></tr>
              <tr><td style="color: #64748b;">Validity:</td><td style="text-align: right; font-weight: 600; color: #0d9488;">30 Days (Oct 05)</td></tr>
            </table>
          </div>
        </div>

        <!-- Scope Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <thead>
            <tr style="background: #0d9488; color: #ffffff;">
              <th style="padding: 10px; text-align: left;">Item / Scope Description</th>
              <th style="padding: 10px; text-align: center;">Estimated Hours</th>
              <th style="padding: 10px; text-align: right;">Hourly Rate</th>
              <th style="padding: 10px; text-align: right;">Estimated Total</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px;">
                <strong>UI/UX Design & Interactive Prototypes</strong>
                <span style="display: block; font-size: 11px; color: #64748b;">User journeys, wireframes, high-fidelity Figma components</span>
              </td>
              <td style="padding: 10px; text-align: center;">40 hrs</td>
              <td style="padding: 10px; text-align: right;">$110.00</td>
              <td style="padding: 10px; text-align: right; font-weight: 600;">$4,400.00</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px;">
                <strong>Frontend Web & Mobile App Development</strong>
                <span style="display: block; font-size: 11px; color: #64748b;">Angular/React component integration & responsive build</span>
              </td>
              <td style="padding: 10px; text-align: center;">60 hrs</td>
              <td style="padding: 10px; text-align: right;">$120.00</td>
              <td style="padding: 10px; text-align: right; font-weight: 600;">$7,200.00</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px;">
                <strong>Quality Assurance & Cross-Browser Testing</strong>
                <span style="display: block; font-size: 11px; color: #64748b;">Automated test suites & browser compatibility verification</span>
              </td>
              <td style="padding: 10px; text-align: center;">15 hrs</td>
              <td style="padding: 10px; text-align: right;">$90.00</td>
              <td style="padding: 10px; text-align: right; font-weight: 600;">$1,350.00</td>
            </tr>
          </tbody>
        </table>

        <!-- Totals & Client Acceptance -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 25px;">
          <div style="width: 280px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #64748b;">
              <span>Subtotal:</span><span>$12,950.00</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #16a34a; font-weight: 600;">
              <span>Partner Discount (5%):</span><span>-$450.00</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 2px solid #0d9488; font-size: 16px; font-weight: 800; color: #0d9488;">
              <span>TOTAL ESTIMATE:</span><span>$12,500.00</span>
            </div>
          </div>
        </div>

        <!-- Terms & Acceptance -->
        <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; font-size: 12px; background: #f8fafc;">
          <strong style="display: block; color: #0f172a; margin-bottom: 4px;">Terms of Acceptance:</strong>
          <p style="margin: 0 0 15px 0; color: #64748b; line-height: 1.4;">
            To accept this quotation and authorize commencement of work, please sign and return this document. 50% deposit required upon project kickoff.
          </p>
          <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 15px; border-top: 1px dashed #cbd5e1;">
            <div>
              <span style="display: block; color: #64748b; font-size: 11px;">Authorized Signature (Client):</span>
              <div style="width: 180px; height: 35px; border-bottom: 1px solid #94a3b8;"></div>
            </div>
            <div>
              <span style="display: block; color: #64748b; font-size: 11px;">Print Name:</span>
              <div style="width: 150px; height: 35px; border-bottom: 1px solid #94a3b8;"></div>
            </div>
            <div>
              <span style="display: block; color: #64748b; font-size: 11px;">Date Accepted:</span>
              <div style="width: 120px; height: 35px; border-bottom: 1px solid #94a3b8;"></div>
            </div>
          </div>
        </div>
      </div>
    `,
  },

  // 5. 🧑💼 HR DOCUMENTS (Offer Letter / Agreement)
  {
    id: 'hr-document',
    name: 'HR Documents',
    shortName: 'HR Letter',
    icon: 'fa fa-id-badge',
    emoji: '🧑💼',
    category: 'corporate',
    categoryLabel: 'Corporate & HR',
    description: 'Formal employment offer letter, contract agreement, salary structure breakdown, probation clauses, and dual employer/employee signature block.',
    features: ['Employee Profile', 'Compensation Schedule', 'Confidentiality Clauses', 'Dual Signatures'],
    tokens: [
      { key: 'candidate_name', label: 'Candidate Full Name', example: 'Alexandre Dubois' },
      { key: 'job_title', label: 'Designation / Title', example: 'Lead Software Architect' },
      { key: 'start_date', label: 'Commencement Date', example: 'October 01, 2026' },
      { key: 'base_salary', label: 'Annual Compensation', example: '$145,000 / annum' },
    ],
    previewSvg: `
      <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #ffffff; border: 1px solid #e2e8f0; display: block; margin: 0 auto 6px;">
        <rect x="0" y="0" width="160" height="18" fill="#4338ca" rx="3"/>
        <rect x="8" y="5" width="50" height="8" fill="#ffffff" rx="2"/>
        <rect x="8" y="26" width="70" height="6" fill="#312e81" rx="1"/>
        <rect x="8" y="36" width="144" height="22" fill="#eef2ff" stroke="#c7d2fe" rx="2"/>
        <rect x="8" y="64" width="144" height="15" fill="#f8fafc" stroke="#cbd5e1" rx="2"/>
        <line x1="12" y1="92" x2="60" y2="92" stroke="#64748b"/>
        <line x1="95" y1="92" x2="145" y2="92" stroke="#64748b"/>
      </svg>
    `,
    defaultHtml: `
      <div class="doc-page hr-container" style="max-width: 800px; margin: 0 auto; padding: 35px; background: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <div style="border-bottom: 2px solid #4338ca; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="margin: 0; color: #4338ca; font-size: 22px; font-weight: 800;">TECHCORP GLOBAL SYSTEMS</h2>
            <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">Human Resources & Talent Management Division</p>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            Ref: HR/OFFER-2026/0942<br>Date: September 05, 2026
          </div>
        </div>

        <div style="margin-bottom: 20px; font-size: 13px; line-height: 1.6;">
          <p style="margin: 0 0 10px 0;">
            <strong>To:</strong><br>
            Mr. Alexandre Dubois<br>
            1404 Renaissance Square, Seattle, WA<br>
            alex.dubois@email.com
          </p>
          <h3 style="margin: 15px 0 10px 0; font-size: 15px; color: #4338ca; font-weight: 700;">SUBJECT: Formal Offer of Employment — Lead Software Architect</h3>
          <p style="margin: 0 0 10px 0;">
            Dear Alexandre,
          </p>
          <p style="margin: 0 0 10px 0; color: #475569;">
            On behalf of TechCorp Global Systems, we are delighted to offer you the position of <strong>Lead Software Architect</strong>. We were thoroughly impressed by your technical mastery, architectural vision, and collaborative leadership during the interview process.
          </p>
        </div>

        <!-- Role & Compensation Table -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #0f172a; font-weight: 700;">Key Terms of Employment</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <tr><td style="padding: 5px 0; color: #64748b; width: 35%;">Designation / Title:</td><td style="font-weight: 600;">Lead Software Architect</td></tr>
            <tr><td style="padding: 5px 0; color: #64748b;">Department:</td><td style="font-weight: 600;">Core Infrastructure & Cloud Engineering</td></tr>
            <tr><td style="padding: 5px 0; color: #64748b;">Commencement Date:</td><td style="font-weight: 600; color: #4338ca;">October 01, 2026</td></tr>
            <tr><td style="padding: 5px 0; color: #64748b;">Annual Base Salary:</td><td style="font-weight: 700; color: #16a34a;">$155,000 USD (Paid semi-monthly)</td></tr>
            <tr><td style="padding: 5px 0; color: #64748b;">Annual Performance Bonus:</td><td style="font-weight: 600;">Up to 15% based on KPI evaluations</td></tr>
            <tr><td style="padding: 5px 0; color: #64748b;">Probationary Period:</td><td style="font-weight: 600;">90 Days from start date</td></tr>
          </table>
        </div>

        <!-- Clauses -->
        <div style="font-size: 12px; color: #475569; line-height: 1.5; margin-bottom: 25px;">
          <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Confidentiality & Intellectual Property:</strong>
          You agree to maintain strict confidentiality regarding all proprietary information, software codebase, client records, and patents. All work product developed during your tenure shall belong exclusively to TechCorp Global Systems.
        </div>

        <!-- Signatures -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 15px; border-top: 1px solid #e2e8f0;">
          <div>
            <div style="width: 180px; border-bottom: 1px solid #475569; margin-bottom: 4px;"></div>
            <strong style="font-size: 12px; color: #0f172a; display: block;">Elena Rostova</strong>
            <span style="font-size: 11px; color: #64748b;">Chief Human Resources Officer</span>
            <span style="font-size: 10px; color: #94a3b8; display: block;">TechCorp Global Systems</span>
          </div>
          <div>
            <div style="width: 180px; border-bottom: 1px solid #475569; margin-bottom: 4px;"></div>
            <strong style="font-size: 12px; color: #0f172a; display: block;">Candidate Acceptance Signature</strong>
            <span style="font-size: 11px; color: #64748b;">Alexandre Dubois</span>
            <span style="font-size: 10px; color: #94a3b8; display: block;">Date: ________________________</span>
          </div>
        </div>
      </div>
    `,
  },

  // 6. 📄 CERTIFICATES
  {
    id: 'certificate',
    name: 'Certificates',
    shortName: 'Certificate',
    icon: 'fa fa-certificate',
    emoji: '📄',
    category: 'corporate',
    categoryLabel: 'Corporate & HR',
    description: 'Prestigious award and completion certificate with ornate borders, gold badge/ribbon graphics, recipient presentation, citation details, and dual signatures.',
    features: ['Ornate Double Border', 'Gold Ribbon / Seal', 'Recipient Citation', 'Dual Signature Lines'],
    tokens: [
      { key: 'recipient_name', label: 'Recipient Name', example: 'Victoria Sterling' },
      { key: 'course_title', label: 'Certificate Title / Program', example: 'Mastery in Enterprise Cloud Architecture' },
      { key: 'issue_date', label: 'Date of Conferral', example: 'September 05, 2026' },
      { key: 'certificate_id', label: 'Verification ID', example: 'CERT-982410-EA' },
    ],
    previewSvg: `
      <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #fffbeb; border: 2px solid #d97706; display: block; margin: 0 auto 6px;">
        <rect x="6" y="6" width="148" height="88" fill="none" stroke="#b45309" stroke-width="1" stroke-dasharray="2,2"/>
        <rect x="30" y="14" width="100" height="7" fill="#78350f" rx="1"/>
        <rect x="45" y="28" width="70" height="4" fill="#92400e" rx="1"/>
        <rect x="25" y="42" width="110" height="10" fill="#fef3c7" stroke="#f59e0b" rx="2"/>
        <circle cx="80" cy="72" r="10" fill="#f59e0b"/>
        <line x1="20" y1="84" x2="55" y2="84" stroke="#78350f"/>
        <line x1="105" y1="84" x2="140" y2="84" stroke="#78350f"/>
      </svg>
    `,
    defaultHtml: `
      <div class="doc-page certificate-container" style="max-width: 850px; margin: 0 auto; padding: 40px; background: #ffffff; font-family: 'Georgia', serif; color: #1e293b; border: 12px double #b45309; border-radius: 4px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center; position: relative;">
        <!-- Inner Border Frame -->
        <div style="border: 2px solid #d97706; padding: 30px; position: relative;">
          <!-- Top Badge / Header -->
          <div style="margin-bottom: 20px;">
            <div style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; padding: 6px 18px; border-radius: 20px; font-family: 'Segoe UI', sans-serif; font-size: 11px; font-weight: 700; color: #b45309; letter-spacing: 1.5px; text-transform: uppercase;">
              ACADEMY OF ADVANCED TECHNOLOGY
            </div>
            <h1 style="margin: 15px 0 5px 0; font-size: 32px; font-weight: 800; color: #78350f; letter-spacing: 1px; text-transform: uppercase;">CERTIFICATE OF ACHIEVEMENT</h1>
            <p style="margin: 0; font-size: 14px; font-style: italic; color: #92400e;">This is proudly presented to</p>
          </div>

          <!-- Recipient Name -->
          <div style="margin: 25px 0;">
            <h2 style="margin: 0; font-size: 34px; color: #1e3a8a; font-family: 'Georgia', serif; font-weight: 700; border-bottom: 2px solid #b45309; display: inline-block; padding: 0 40px 8px 40px;">
              Victoria Sterling
            </h2>
          </div>

          <!-- Citation Text -->
          <p style="font-size: 14px; color: #475569; max-width: 600px; margin: 0 auto 25px auto; line-height: 1.7;">
            for successfully completing the rigorous postgraduate curriculum in <strong>Mastery of Enterprise Cloud Architecture & Distributed Systems</strong> with First Class Distinction.
          </p>

          <!-- Golden Seal Mockup -->
          <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 25px;">
            <div style="width: 65px; height: 65px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #b45309); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 26px; box-shadow: 0 4px 10px rgba(180, 83, 9, 0.3);">
              ★
            </div>
          </div>

          <!-- Signatures & Verification ID -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 15px; font-family: 'Segoe UI', sans-serif;">
            <div style="width: 200px; text-align: center;">
              <div style="border-bottom: 1px solid #78350f; height: 35px; margin-bottom: 4px;"></div>
              <strong style="font-size: 12px; color: #0f172a; display: block;">Dr. Marcus Aurelius</strong>
              <span style="font-size: 11px; color: #64748b;">Chancellor & Academic Dean</span>
            </div>
            <div style="text-align: center; font-size: 11px; color: #64748b;">
              <span style="display: block; font-weight: 700; color: #b45309;">VERIFIED CREDENTIAL</span>
              ID: CERT-982410-EA<br>Issued: Sep 05, 2026
            </div>
            <div style="width: 200px; text-align: center;">
              <div style="border-bottom: 1px solid #78350f; height: 35px; margin-bottom: 4px;"></div>
              <strong style="font-size: 12px; color: #0f172a; display: block;">Eleanor Vance</strong>
              <span style="font-size: 11px; color: #64748b;">Director of Education</span>
            </div>
          </div>
        </div>
      </div>
    `,
  },

  // 7. 🧾 RECEIPTS
  {
    id: 'receipt',
    name: 'Receipts',
    shortName: 'Receipt',
    icon: 'fa fa-money',
    emoji: '🧾',
    category: 'finance',
    categoryLabel: 'Finance & Billing',
    description: 'Clean transaction receipt (supporting both point-of-sale retail slip and payment voucher) with item breakdown, payment method, tax, and paid stamp.',
    features: ['Retail Slip Style', 'Itemized Breakdown', 'Payment Method Info', 'Paid In Full Badge'],
    tokens: [
      { key: 'receipt_number', label: 'Receipt ID', example: 'REC-2026-9041' },
      { key: 'payment_method', label: 'Method of Payment', example: 'Visa Credit ****4921' },
      { key: 'total_paid', label: 'Total Amount Paid', example: '$89.50' },
    ],
    previewSvg: `
      <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #ffffff; border: 1px solid #e2e8f0; display: block; margin: 0 auto 6px;">
        <rect x="35" y="4" width="90" height="92" fill="#fafafa" stroke="#cbd5e1" rx="2"/>
        <rect x="50" y="10" width="60" height="6" fill="#0f172a" rx="1"/>
        <rect x="42" y="22" width="76" height="3" fill="#94a3b8"/>
        <rect x="42" y="30" width="50" height="3" fill="#64748b"/>
        <rect x="100" y="30" width="18" height="3" fill="#64748b"/>
        <rect x="42" y="38" width="45" height="3" fill="#64748b"/>
        <rect x="100" y="38" width="18" height="3" fill="#64748b"/>
        <line x1="42" y1="48" x2="118" y2="48" stroke="#cbd5e1" stroke-dasharray="2,2"/>
        <rect x="42" y="54" width="30" height="4" fill="#0f172a"/>
        <rect x="90" y="54" width="28" height="4" fill="#16a34a"/>
        <rect x="55" y="70" width="50" height="15" fill="#dcfce7" stroke="#86efac" rx="2"/>
      </svg>
    `,
    defaultHtml: `
      <div class="doc-page receipt-container" style="max-width: 420px; margin: 0 auto; padding: 25px; background: #ffffff; font-family: 'Courier New', Courier, monospace; color: #0f172a; border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
        <!-- Merchant Info -->
        <div style="text-align: center; border-bottom: 2px dashed #94a3b8; padding-bottom: 15px; margin-bottom: 15px;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase;">NEXUS RETAIL STORE</h2>
          <p style="margin: 3px 0 0 0; font-size: 11px; color: #475569;">
            Store #104 - Downtown Arcade<br>
            788 Pacific Way, Seattle, WA<br>
            Tel: +1 (206) 555-0144
          </p>
          <div style="margin-top: 10px; font-size: 11px; color: #64748b;">
            Receipt: #REC-2026-9041<br>
            Date: 05-Sep-2026 14:22:18 | Cashier: #08 (Dan)
          </div>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px;">
          <thead>
            <tr style="border-bottom: 1px solid #0f172a;">
              <th style="text-align: left; padding: 4px 0;">Item Description</th>
              <th style="text-align: center; padding: 4px 0;">Qty</th>
              <th style="text-align: right; padding: 4px 0;">Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 6px 0;">Premium Wireless Keyboard</td>
              <td style="text-align: center; padding: 6px 0;">1</td>
              <td style="text-align: right; padding: 6px 0;">$54.00</td>
            </tr>
            <tr>
              <td style="padding: 6px 0;">Ergonomic Mousepad (Gel)</td>
              <td style="text-align: center; padding: 6px 0;">2</td>
              <td style="text-align: right; padding: 6px 0;">$24.00</td>
            </tr>
            <tr>
              <td style="padding: 6px 0;">USB-C Braided Cable 2M</td>
              <td style="text-align: center; padding: 6px 0;">1</td>
              <td style="text-align: right; padding: 6px 0;">$11.50</td>
            </tr>
          </tbody>
        </table>

        <!-- Totals Summary -->
        <div style="border-top: 2px dashed #94a3b8; padding-top: 10px; font-size: 12px; margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; padding: 3px 0;">
            <span>Subtotal:</span><span>$89.50</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 3px 0;">
            <span>Sales Tax (8.5%):</span><span>$7.61</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 15px; font-weight: 800; border-top: 1px solid #0f172a; margin-top: 4px;">
            <span>TOTAL PAID:</span><span>$97.11</span>
          </div>
        </div>

        <!-- Payment Method Details -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 4px; font-size: 11px; margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Payment Method:</span><span>VISA CREDIT</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Card Number:</span><span>************4921</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Auth Code:</span><span>#88419A</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Status:</span><strong style="color: #16a34a;">TRANSACTION APPROVED</strong>
          </div>
        </div>

        <!-- Stamp & Barcode -->
        <div style="text-align: center; font-size: 11px; color: #64748b;">
          <div style="display: inline-block; border: 2px solid #16a34a; color: #16a34a; padding: 4px 14px; border-radius: 4px; font-weight: 800; letter-spacing: 1px; margin-bottom: 10px;">
            PAID IN FULL
          </div>
          <p style="margin: 0; font-size: 10px;">
            Thank you for shopping with us!<br>
            Returns accepted within 14 days with this receipt.
          </p>
        </div>
      </div>
    `,
  },

  // 8. 📑 PROPOSALS
  {
    id: 'proposal',
    name: 'Proposals',
    shortName: 'Proposal',
    icon: 'fa fa-briefcase',
    emoji: '📑',
    category: 'proposals',
    categoryLabel: 'Corporate & HR',
    description: 'High-impact business and project proposal with executive overview, solution methodology, phased roadmap timeline, budget summary, and approval sign-off.',
    features: ['Project Cover Block', 'Phased Roadmap', 'Investment Summary', 'Approval Sign-off'],
    tokens: [
      { key: 'project_name', label: 'Project Name', example: 'Enterprise Mobile Banking App' },
      { key: 'target_client', label: 'Proposed For', example: 'Capital First Bank' },
      { key: 'proposal_version', label: 'Version', example: 'v2.1' },
      { key: 'total_investment', label: 'Proposed Budget', example: '$85,000 USD' },
    ],
    previewSvg: `
      <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #ffffff; border: 1px solid #e2e8f0; display: block; margin: 0 auto 6px;">
        <rect x="0" y="0" width="160" height="22" fill="#4f46e5" rx="3"/>
        <rect x="8" y="7" width="60" height="8" fill="#ffffff" rx="2"/>
        <rect x="8" y="30" width="144" height="15" fill="#eef2ff" stroke="#c7d2fe" rx="2"/>
        <circle cx="18" cy="58" r="4" fill="#4f46e5"/>
        <line x1="22" y1="58" x2="60" y2="58" stroke="#4f46e5" stroke-width="2"/>
        <circle cx="64" cy="58" r="4" fill="#4f46e5"/>
        <line x1="68" y1="58" x2="105" y2="58" stroke="#4f46e5" stroke-width="2"/>
        <circle cx="110" cy="58" r="4" fill="#4f46e5"/>
        <rect x="8" y="75" width="144" height="18" fill="#f8fafc" stroke="#cbd5e1" rx="2"/>
      </svg>
    `,
    defaultHtml: `
      <div class="doc-page proposal-container" style="max-width: 800px; margin: 0 auto; padding: 35px; background: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <!-- Proposal Header -->
        <div style="background: linear-gradient(135deg, #4f46e5, #3730a3); color: #ffffff; padding: 25px; border-radius: 6px; margin-bottom: 25px;">
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; background: rgba(255,255,255,0.2); padding: 3px 10px; border-radius: 12px;">BUSINESS PROPOSAL</span>
          <h1 style="margin: 10px 0 6px 0; font-size: 26px; font-weight: 800;">Enterprise Mobile Banking App Modernization</h1>
          <p style="margin: 0; font-size: 13px; opacity: 0.9;">Prepared for: Capital First Bank | Submitted by: Strata Digital Labs | Version 2.0</p>
        </div>

        <!-- Problem & Solution Overview -->
        <div style="margin-bottom: 25px; font-size: 13px; line-height: 1.6;">
          <h3 style="font-size: 16px; color: #0f172a; margin: 0 0 8px 0; font-weight: 700;">1. Executive Summary & Objective</h3>
          <p style="margin: 0 0 12px 0; color: #475569;">
            Capital First Bank requires an ultra-responsive, zero-trust mobile banking platform delivering biometrics, real-time wire transfers, and personalized wealth management insights to over 500,000 active retail accounts.
          </p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px; color: #166534;">
            <strong>Proposed Solution:</strong> Deliver a native cross-platform application utilizing microservices architecture, PCI-DSS compliant data vaults, and sub-100ms API response times.
          </div>
        </div>

        <!-- Phased Implementation Roadmap -->
        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 16px; color: #0f172a; margin: 0 0 12px 0; font-weight: 700;">2. Project Phases & Milestone Roadmap</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
            <div style="background: #f8fafc; border-top: 3px solid #4f46e5; border: 1px solid #e2e8f0; padding: 12px; border-radius: 4px;">
              <strong style="color: #4f46e5; font-size: 12px; display: block; margin-bottom: 4px;">Phase 1: Discovery & UX</strong>
              <span style="font-size: 11px; color: #64748b; display: block; margin-bottom: 6px;">Weeks 1 - 4</span>
              <p style="margin: 0; font-size: 12px; color: #475569;">Figma design system, stakeholder workshops, security compliance review.</p>
            </div>
            <div style="background: #f8fafc; border-top: 3px solid #4f46e5; border: 1px solid #e2e8f0; padding: 12px; border-radius: 4px;">
              <strong style="color: #4f46e5; font-size: 12px; display: block; margin-bottom: 4px;">Phase 2: Core Engineering</strong>
              <span style="font-size: 11px; color: #64748b; display: block; margin-bottom: 6px;">Weeks 5 - 12</span>
              <p style="margin: 0; font-size: 12px; color: #475569;">Biometric authentication, core banking API integrations, push notifications.</p>
            </div>
            <div style="background: #f8fafc; border-top: 3px solid #4f46e5; border: 1px solid #e2e8f0; padding: 12px; border-radius: 4px;">
              <strong style="color: #4f46e5; font-size: 12px; display: block; margin-bottom: 4px;">Phase 3: QA & Launch</strong>
              <span style="font-size: 11px; color: #64748b; display: block; margin-bottom: 6px;">Weeks 13 - 16</span>
              <p style="margin: 0; font-size: 12px; color: #475569;">Penetration testing, App Store deployment, SLA monitoring setup.</p>
            </div>
          </div>
        </div>

        <!-- Budget & Investment -->
        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 16px; color: #0f172a; margin: 0 0 10px 0; font-weight: 700;">3. Investment Summary</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: #f1f5f9; color: #475569; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 8px 10px; text-align: left;">Phase Deliverables</th>
                <th style="padding: 8px 10px; text-align: center;">Timeline</th>
                <th style="padding: 8px 10px; text-align: right;">Cost (USD)</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">Discovery, User Research & Design Specs</td><td style="text-align: center;">Month 1</td><td style="text-align: right;">$22,000</td></tr>
              <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">Frontend & Mobile App Build</td><td style="text-align: center;">Month 2</td><td style="text-align: right;">$38,000</td></tr>
              <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">Security Hardening, Penetration Testing & SLA</td><td style="text-align: center;">Month 3</td><td style="text-align: right;">$25,000</td></tr>
              <tr style="font-weight: 800; font-size: 14px; border-top: 2px solid #0f172a;"><td style="padding: 10px 10px;">Total Proposed Investment:</td><td></td><td style="text-align: right; color: #4f46e5;">$85,000 USD</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Sign-off -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; display: flex; justify-content: space-between; font-size: 12px;">
          <div>
            <span style="display: block; color: #64748b; margin-bottom: 25px;">Submitted by Strata Labs:</span>
            <strong>Julian Rivera</strong><br><span style="color: #64748b;">Managing Director</span>
          </div>
          <div>
            <span style="display: block; color: #64748b; margin-bottom: 25px;">Accepted for Capital First:</span>
            <div style="border-bottom: 1px solid #94a3b8; width: 160px; margin-bottom: 4px;"></div>
            <span style="color: #64748b;">Authorized Signatory</span>
          </div>
        </div>
      </div>
    `,
  },

  // 9. 📈 FINANCIAL REPORTS
  {
    id: 'financial-report',
    name: 'Financial Reports',
    shortName: 'Financials',
    icon: 'fa fa-line-chart',
    emoji: '📈',
    category: 'finance',
    categoryLabel: 'Finance & Billing',
    description: 'Statement of income (Profit & Loss), balance sheet highlights, key financial indicators (Gross Margin, EBITDA), and auditor notes.',
    features: ['Income Statement (P&L)', 'Financial Ratios Box', 'Quarterly Comparisons', 'Auditor Sign-off'],
    tokens: [
      { key: 'fiscal_period', label: 'Fiscal Period', example: 'FY 2026 Q2' },
      { key: 'gross_margin', label: 'Gross Margin', example: '68.4%' },
      { key: 'net_income', label: 'Net Operating Income', example: '$540,200' },
    ],
    previewSvg: `
      <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #ffffff; border: 1px solid #e2e8f0; display: block; margin: 0 auto 6px;">
        <rect x="0" y="0" width="160" height="20" fill="#047857" rx="3"/>
        <rect x="8" y="6" width="65" height="8" fill="#ffffff" rx="2"/>
        <rect x="8" y="27" width="45" height="18" fill="#ecfdf5" stroke="#a7f3d0" rx="2"/>
        <rect x="58" y="27" width="45" height="18" fill="#eff6ff" stroke="#bfdbfe" rx="2"/>
        <rect x="108" y="27" width="44" height="18" fill="#fef2f2" stroke="#fecaca" rx="2"/>
        <rect x="8" y="52" width="144" height="42" fill="#f8fafc" stroke="#cbd5e1" rx="2"/>
      </svg>
    `,
    defaultHtml: `
      <div class="doc-page finance-container" style="max-width: 820px; margin: 0 auto; padding: 35px; background: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <div style="border-bottom: 2px solid #047857; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #047857; font-weight: 700;">AUDITED FINANCIAL STATEMENT</span>
            <h1 style="margin: 4px 0 0 0; font-size: 24px; color: #0f172a; font-weight: 800;">Statement of Profit & Loss (Income Statement)</h1>
            <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">For the Quarter Ended June 30, 2026 (Expressed in USD)</p>
          </div>
          <div style="text-align: right; font-size: 12px; color: #64748b;">
            <strong>Aura Technologies Group Inc.</strong><br>
            SEC Filing / GAAP Standards
          </div>
        </div>

        <!-- Ratio Cards -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 25px;">
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px; text-align: center;">
            <span style="font-size: 11px; color: #166534; font-weight: 700;">GROSS MARGIN</span>
            <h3 style="margin: 4px 0; font-size: 22px; color: #15803d;">68.4%</h3>
            <span style="font-size: 11px; color: #16a34a;">+2.1% vs Q1</span>
          </div>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 6px; text-align: center;">
            <span style="font-size: 11px; color: #1e40af; font-weight: 700;">EBITDA</span>
            <h3 style="margin: 4px 0; font-size: 22px; color: #1d4ed8;">$712,400</h3>
            <span style="font-size: 11px; color: #2563eb;">28.5% Margin</span>
          </div>
          <div style="background: #faf5ff; border: 1px solid #e9d5ff; padding: 12px; border-radius: 6px; text-align: center;">
            <span style="font-size: 11px; color: #6b21a8; font-weight: 700;">NET OPERATING PROFIT</span>
            <h3 style="margin: 4px 0; font-size: 22px; color: #7e22ce;">$540,200</h3>
            <span style="font-size: 11px; color: #9333ea;">Diluted EPS: $1.12</span>
          </div>
        </div>

        <!-- Income Statement Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 25px;">
          <thead>
            <tr style="background: #047857; color: #ffffff;">
              <th style="padding: 10px; text-align: left;">Revenue & Expense Accounts</th>
              <th style="padding: 10px; text-align: right;">Q2 2026 ($)</th>
              <th style="padding: 10px; text-align: right;">Q1 2026 ($)</th>
              <th style="padding: 10px; text-align: right;">Variance %</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background: #f8fafc; font-weight: 700; border-bottom: 1px solid #cbd5e1;">
              <td style="padding: 8px 10px;">Total Operating Revenue</td>
              <td style="padding: 8px 10px; text-align: right;">$2,498,000</td>
              <td style="padding: 8px 10px; text-align: right;">$2,180,000</td>
              <td style="padding: 8px 10px; text-align: right; color: #16a34a;">+14.6%</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 10px; padding-left: 25px; color: #64748b;">Less: Cost of Goods Sold (COGS)</td>
              <td style="padding: 8px 10px; text-align: right;">($790,000)</td>
              <td style="padding: 8px 10px; text-align: right;">($725,000)</td>
              <td style="padding: 8px 10px; text-align: right;">+8.9%</td>
            </tr>
            <tr style="font-weight: 700; background: #ecfdf5; border-bottom: 2px solid #a7f3d0;">
              <td style="padding: 8px 10px;">GROSS PROFIT</td>
              <td style="padding: 8px 10px; text-align: right; color: #047857;">$1,708,000</td>
              <td style="padding: 8px 10px; text-align: right;">$1,455,000</td>
              <td style="padding: 8px 10px; text-align: right; color: #16a34a;">+17.4%</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 10px; padding-left: 25px;">Research & Product Development</td>
              <td style="padding: 8px 10px; text-align: right;">($420,000)</td>
              <td style="padding: 8px 10px; text-align: right;">($380,000)</td>
              <td style="padding: 8px 10px; text-align: right;">+10.5%</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 10px; padding-left: 25px;">Sales & Marketing Expenses</td>
              <td style="padding: 8px 10px; text-align: right;">($380,000)</td>
              <td style="padding: 8px 10px; text-align: right;">($360,000)</td>
              <td style="padding: 8px 10px; text-align: right;">+5.5%</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 10px; padding-left: 25px;">General & Administrative (G&A)</td>
              <td style="padding: 8px 10px; text-align: right;">($240,000)</td>
              <td style="padding: 8px 10px; text-align: right;">($230,000)</td>
              <td style="padding: 8px 10px; text-align: right;">+4.3%</td>
            </tr>
            <tr style="background: #f0fdf4; font-weight: 800; font-size: 14px; border-top: 2px solid #047857; border-bottom: 3px double #047857;">
              <td style="padding: 10px;">NET OPERATING INCOME</td>
              <td style="padding: 10px; text-align: right; color: #047857;">$540,200</td>
              <td style="padding: 10px; text-align: right;">$412,000</td>
              <td style="padding: 10px; text-align: right; color: #16a34a;">+31.1%</td>
            </tr>
          </tbody>
        </table>

        <!-- Auditor Note -->
        <div style="font-size: 11px; color: #64748b; line-height: 1.4; border-top: 1px solid #e2e8f0; padding-top: 10px;">
          Note: These interim consolidated financial statements have been prepared in compliance with GAAP. Verified by Independent Audit Committee.
        </div>
      </div>
    `,
  },

  // 10. 🏪 RESTAURANT MENUS
  {
    id: 'restaurant-menu',
    name: 'Restaurant Menus',
    shortName: 'Menu',
    icon: 'fa fa-cutlery',
    emoji: '🏪',
    category: 'hospitality',
    categoryLabel: 'Hospitality & Dining',
    description: 'Artisanal dining menu with categorized courses (Appetizers, Mains, Desserts, Cocktails), dietary badges (🌱 Vegan, 🌾 GF, 🌶️ Spicy), and prices.',
    features: ['Categorized Sections', 'Dietary Badges', 'Chef Recommendation Highlights', 'Beverage List'],
    tokens: [
      { key: 'restaurant_name', label: 'Restaurant Name', example: 'Bella Vista Ristorante' },
      { key: 'cuisine_type', label: 'Cuisine Style', example: 'Modern Northern Italian' },
      { key: 'season_edition', label: 'Menu Edition', example: 'Autumn / Winter Collection' },
    ],
    previewSvg: `
      <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #fffbeb; border: 1px solid #fcd34d; display: block; margin: 0 auto 6px;">
        <rect x="0" y="0" width="160" height="20" fill="#991b1b" rx="3"/>
        <rect x="40" y="6" width="80" height="8" fill="#ffffff" rx="2"/>
        <rect x="8" y="28" width="55" height="5" fill="#b91c1c" rx="1"/>
        <rect x="8" y="37" width="100" height="4" fill="#78350f" rx="1"/>
        <rect x="135" y="37" width="17" height="4" fill="#991b1b" rx="1"/>
        <rect x="8" y="44" width="120" height="3" fill="#a8a29e"/>
        <rect x="8" y="58" width="55" height="5" fill="#b91c1c" rx="1"/>
        <rect x="8" y="67" width="100" height="4" fill="#78350f" rx="1"/>
        <rect x="135" y="67" width="17" height="4" fill="#991b1b" rx="1"/>
        <rect x="8" y="74" width="120" height="3" fill="#a8a29e"/>
      </svg>
    `,
    defaultHtml: `
      <div class="doc-page menu-container" style="max-width: 780px; margin: 0 auto; padding: 40px; background: #fffbf5; font-family: 'Georgia', serif; color: #292524; border: 2px solid #e7e5e4; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
        <!-- Menu Header -->
        <div style="text-align: center; border-bottom: 2px solid #991b1b; padding-bottom: 20px; margin-bottom: 25px;">
          <h1 style="margin: 0; font-size: 32px; color: #991b1b; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">BELLA VISTA</h1>
          <p style="margin: 4px 0 0 0; font-size: 13px; font-style: italic; color: #78716c; letter-spacing: 1px;">Artisanal Italian Trattoria & Wine Bar</p>
          <div style="margin-top: 8px; font-family: 'Segoe UI', sans-serif; font-size: 11px; color: #a8a29e; text-transform: uppercase; letter-spacing: 1px;">
            Autumn / Winter Tasting Selection
          </div>
        </div>

        <!-- Antipasti / Starters -->
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; color: #991b1b; border-bottom: 1px solid #fed7aa; padding-bottom: 4px; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 1.5px; text-align: center;">
            Antipasti & Primi
          </h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <strong style="font-size: 15px; color: #1c1917;">Truffle Burrata Pugliese</strong>
                <span style="font-weight: 700; color: #991b1b;">$21.00</span>
              </div>
              <p style="margin: 3px 0 0 0; font-size: 12px; color: #78716c; font-style: italic; line-height: 1.4;">
                Creamy burrata, shaved black summer truffles, heirloom confit tomatoes, aged Modena balsamic.
              </p>
              <span style="font-family: 'Segoe UI', sans-serif; font-size: 10px; background: #dcfce7; color: #15803d; padding: 1px 6px; border-radius: 4px;">🌱 VEGETARIAN</span>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <strong style="font-size: 15px; color: #1c1917;">Carpaccio di Manzo</strong>
                <span style="font-weight: 700; color: #991b1b;">$23.50</span>
              </div>
              <p style="margin: 3px 0 0 0; font-size: 12px; color: #78716c; font-style: italic; line-height: 1.4;">
                Thinly sliced dry-aged beef tenderloin, wild baby arugula, 24-month Parmigiano-Reggiano, capers.
              </p>
              <span style="font-family: 'Segoe UI', sans-serif; font-size: 10px; background: #eff6ff; color: #1d4ed8; padding: 1px 6px; border-radius: 4px;">🌾 GLUTEN-FREE</span>
            </div>
          </div>
        </div>

        <!-- Secondi / Mains -->
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; color: #991b1b; border-bottom: 1px solid #fed7aa; padding-bottom: 4px; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 1.5px; text-align: center;">
            Secondi Piatti (Mains)
          </h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <strong style="font-size: 15px; color: #1c1917;">Ossobuco alla Milanese</strong>
                <span style="font-weight: 700; color: #991b1b;">$38.00</span>
              </div>
              <p style="margin: 3px 0 0 0; font-size: 12px; color: #78716c; font-style: italic; line-height: 1.4;">
                Slow-braised cross-cut veal shank, saffron risotto, citrus gremolata, bone marrow jus.
              </p>
              <span style="font-family: 'Segoe UI', sans-serif; font-size: 10px; background: #fef3c7; color: #b45309; padding: 1px 6px; border-radius: 4px;">⭐ CHEF'S SPECIAL</span>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <strong style="font-size: 15px; color: #1c1917;">Wild Chilean Sea Bass</strong>
                <span style="font-weight: 700; color: #991b1b;">$36.50</span>
              </div>
              <p style="margin: 3px 0 0 0; font-size: 12px; color: #78716c; font-style: italic; line-height: 1.4;">
                Pan-seared sea bass, fennel puree, blistered taggiasca olives, saffron broth.
              </p>
              <span style="font-family: 'Segoe UI', sans-serif; font-size: 10px; background: #eff6ff; color: #1d4ed8; padding: 1px 6px; border-radius: 4px;">🌾 GLUTEN-FREE</span>
            </div>
          </div>
        </div>

        <!-- Dolci & Wine -->
        <div style="border-top: 1px dashed #d6d3d1; padding-top: 20px; text-align: center;">
          <h3 style="font-size: 16px; color: #991b1b; margin: 0 0 6px 0;">Dolci (Desserts)</h3>
          <p style="margin: 0; font-size: 13px; color: #57534e;">
            Traditional Espresso Tiramisù ($12.00) &bull; Sicilian Pistachio Cannoli ($11.00) &bull; Vanilla Bean Panna Cotta ($10.50)
          </p>
          <div style="margin-top: 15px; font-family: 'Segoe UI', sans-serif; font-size: 11px; color: #a8a29e;">
            Please inform your server of any dietary allergies. An 18% gratuity is included for parties of 6 or more.
          </div>
        </div>
      </div>
    `,
  },

  // 11. 📦 DELIVERY NOTES
  {
    id: 'delivery-note',
    name: 'Delivery Notes',
    shortName: 'Delivery Note',
    icon: 'fa fa-truck',
    emoji: '📦',
    category: 'operations',
    categoryLabel: 'Operations & Logistics',
    description: 'Dispatch advice and delivery slip with consignor/consignee addresses, carrier tracking, item checklist (ordered vs. shipped), and recipient proof of delivery.',
    features: ['Shipper & Consignee Details', 'Tracking & Vehicle Meta', 'Dispatch Items Checklist', 'Proof of Delivery Signature'],
    tokens: [
      { key: 'delivery_note_no', label: 'Delivery Note #', example: 'DN-2026-7814' },
      { key: 'carrier_tracking', label: 'Tracking Number', example: 'FEDEX-9401-2849-US' },
      { key: 'recipient_name', label: 'Received By', example: 'Warehouse Lead / Receiver' },
    ],
    previewSvg: `
      <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #ffffff; border: 1px solid #e2e8f0; display: block; margin: 0 auto 6px;">
        <rect x="0" y="0" width="160" height="20" fill="#ea580c" rx="3"/>
        <rect x="8" y="6" width="60" height="8" fill="#ffffff" rx="2"/>
        <rect x="8" y="27" width="68" height="18" fill="#fff7ed" stroke="#fed7aa" rx="2"/>
        <rect x="84" y="27" width="68" height="18" fill="#f8fafc" stroke="#cbd5e1" rx="2"/>
        <rect x="8" y="50" width="144" height="28" fill="#ffffff" stroke="#cbd5e1" rx="2"/>
        <line x1="8" y1="58" x2="152" y2="58" stroke="#cbd5e1"/>
        <rect x="8" y="82" width="144" height="12" fill="#fff7ed" rx="2"/>
      </svg>
    `,
    defaultHtml: `
      <div class="doc-page delivery-container" style="max-width: 800px; margin: 0 auto; padding: 35px; background: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #ea580c; padding-bottom: 18px; margin-bottom: 20px;">
          <div>
            <h1 style="margin: 0; font-size: 24px; color: #ea580c; font-weight: 800;">DELIVERY NOTE & DISPATCH SLIP</h1>
            <p style="margin: 3px 0 0 0; font-size: 13px; color: #64748b;">Goods Dispatch & Verification Document</p>
          </div>
          <div style="text-align: right; font-size: 12px; color: #64748b;">
            <strong style="color: #0f172a; font-size: 14px; display: block;">Apex Global Logistics Hub</strong>
            Dock 4, Industrial Logistics Park<br>
            Chicago, IL 60607 | logistics@apexship.com
          </div>
        </div>

        <!-- Meta Grid -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px;">
          <div style="flex: 1; background: #fff7ed; padding: 12px 15px; border-radius: 6px; border: 1px solid #ffedd5; margin-right: 15px;">
            <strong style="color: #c2410c; display: block; margin-bottom: 4px;">Deliver To (Consignee):</strong>
            <strong style="font-size: 14px; color: #0f172a; display: block;">Summit Distribution Center</strong>
            <span style="color: #475569;">Building C, Bay 14, 1200 Logistics Blvd</span><br>
            <span style="color: #64748b;">Denver, CO 80216 | Attn: Receiving Lead</span>
          </div>
          <div style="flex: 1; background: #f8fafc; padding: 12px 15px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="color: #64748b;">Delivery Note #:</td><td style="text-align: right; font-weight: 700; color: #0f172a;">DN-2026-7814</td></tr>
              <tr><td style="color: #64748b;">Sales / PO Order:</td><td style="text-align: right; font-weight: 600;">PO-491024</td></tr>
              <tr><td style="color: #64748b;">Dispatch Date:</td><td style="text-align: right; font-weight: 600;">Sep 05, 2026</td></tr>
              <tr><td style="color: #64748b;">Carrier & Tracking:</td><td style="text-align: right; font-weight: 600; color: #ea580c;">FedEx Freight #9812-4019</td></tr>
            </table>
          </div>
        </div>

        <!-- Dispatched Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px;">
          <thead>
            <tr style="background: #ea580c; color: #ffffff;">
              <th style="padding: 10px; text-align: left;">SKU / Item Code</th>
              <th style="padding: 10px; text-align: left;">Item Description</th>
              <th style="padding: 10px; text-align: center;">Ordered</th>
              <th style="padding: 10px; text-align: center;">Shipped</th>
              <th style="padding: 10px; text-align: center;">Condition</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-family: monospace; font-weight: 700;">HDW-SRV-2U</td>
              <td style="padding: 10px;">
                <strong>Rackmount Enterprise Server 2U Chassis</strong>
                <span style="display: block; font-size: 11px; color: #64748b;">Serial: SN-88401928, Includes rail kit</span>
              </td>
              <td style="padding: 10px; text-align: center;">4</td>
              <td style="padding: 10px; text-align: center; font-weight: 700; color: #15803d;">4 Units</td>
              <td style="padding: 10px; text-align: center;"><span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 10px; font-size: 11px;">SEALED / NEW</span></td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-family: monospace; font-weight: 700;">NET-SW-48G</td>
              <td style="padding: 10px;">
                <strong>48-Port Managed Gigabit PoE+ Switch</strong>
                <span style="display: block; font-size: 11px; color: #64748b;">Serial: SN-49102834</span>
              </td>
              <td style="padding: 10px; text-align: center;">2</td>
              <td style="padding: 10px; text-align: center; font-weight: 700; color: #15803d;">2 Units</td>
              <td style="padding: 10px; text-align: center;"><span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 10px; font-size: 11px;">SEALED / NEW</span></td>
            </tr>
          </tbody>
        </table>

        <!-- Proof of Delivery Section -->
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 18px;">
          <strong style="display: block; font-size: 13px; color: #0f172a; margin-bottom: 4px;">Proof of Delivery / Receiver Acknowledgement</strong>
          <p style="margin: 0 0 15px 0; font-size: 11px; color: #64748b;">
            I hereby confirm that the goods listed above have been received in good order and condition with packaging seals intact.
          </p>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; font-size: 12px;">
            <div>
              <span style="color: #64748b; display: block; font-size: 11px;">Received By (Print Name):</span>
              <div style="border-bottom: 1px solid #94a3b8; height: 32px;"></div>
            </div>
            <div>
              <span style="color: #64748b; display: block; font-size: 11px;">Signature:</span>
              <div style="border-bottom: 1px solid #94a3b8; height: 32px;"></div>
            </div>
            <div>
              <span style="color: #64748b; display: block; font-size: 11px;">Date & Time Received:</span>
              <div style="border-bottom: 1px solid #94a3b8; height: 32px;"></div>
            </div>
          </div>
        </div>
      </div>
    `,
  },

  // 12. 💼 BUSINESS LETTERS
  {
    id: 'business-letter',
    name: 'Business Letters',
    shortName: 'Business Letter',
    icon: 'fa fa-envelope-o',
    emoji: '💼',
    category: 'corporate',
    categoryLabel: 'Corporate & HR',
    description: 'Formal corporate business letter on modern letterhead with recipient addressing, subject reference, styled paragraphs, complimentary closing, and signature block.',
    features: ['Corporate Letterhead', 'Recipient Address Block', 'Formal Typography & Salutation', 'Executive Signature Block'],
    tokens: [
      { key: 'letter_subject', label: 'Subject Line', example: 'Strategic Partnership Authorization' },
      { key: 'recipient_name', label: 'Recipient Name', example: 'Mr. David Harrington' },
      { key: 'sender_title', label: 'Sender Title', example: 'Chief Executive Officer' },
    ],
    previewSvg: `
      <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #ffffff; border: 1px solid #e2e8f0; display: block; margin: 0 auto 6px;">
        <rect x="0" y="0" width="160" height="15" fill="#334155" rx="3"/>
        <rect x="8" y="4" width="45" height="7" fill="#ffffff" rx="2"/>
        <rect x="8" y="24" width="40" height="4" fill="#64748b" rx="1"/>
        <rect x="8" y="32" width="60" height="4" fill="#94a3b8" rx="1"/>
        <rect x="8" y="44" width="80" height="5" fill="#1e293b" rx="1"/>
        <rect x="8" y="55" width="144" height="3" fill="#cbd5e1"/>
        <rect x="8" y="62" width="144" height="3" fill="#cbd5e1"/>
        <rect x="8" y="69" width="120" height="3" fill="#cbd5e1"/>
        <rect x="8" y="82" width="45" height="5" fill="#334155" rx="1"/>
      </svg>
    `,
    defaultHtml: `
      <div class="doc-page letter-container" style="max-width: 780px; margin: 0 auto; padding: 45px; background: #ffffff; font-family: 'Times New Roman', Times, serif; color: #1e293b; border-radius: 4px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; line-height: 1.7;">
        <!-- Letterhead -->
        <div style="border-bottom: 2px solid #334155; padding-bottom: 18px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start; font-family: 'Segoe UI', Arial, sans-serif;">
          <div>
            <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px;">APEX ENTERPRISES LTD</h2>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Global Corporate Affairs & Governance</p>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            One Financial Center, Suite 3200<br>
            Boston, Massachusetts 02111<br>
            contact@apexenterprises.com | +1 (617) 555-0182
          </div>
        </div>

        <!-- Date & Recipient -->
        <div style="margin-bottom: 25px; font-size: 14px;">
          <p style="margin: 0 0 20px 0;">September 05, 2026</p>
          <p style="margin: 0; line-height: 1.4;">
            <strong>Mr. David Harrington</strong><br>
            Managing Director & Chief Investment Officer<br>
            Vanguard Capital Partners LLC<br>
            500 Park Avenue, 18th Floor<br>
            New York, NY 10022
          </p>
        </div>

        <!-- Subject Line -->
        <div style="margin-bottom: 20px;">
          <strong style="font-size: 15px; text-decoration: underline; color: #0f172a;">
            SUBJECT: Official Endorsement & Authorization of Strategic Venture Agreement
          </strong>
        </div>

        <!-- Letter Body -->
        <div style="font-size: 14px; color: #334155; text-align: justify; margin-bottom: 25px;">
          <p style="margin: 0 0 14px 0;">
            Dear Mr. Harrington,
          </p>
          <p style="margin: 0 0 14px 0;">
            I am writing on behalf of the Board of Directors of Apex Enterprises Ltd to formally communicate our unanimous approval and enthusiastic endorsement of the proposed Strategic Joint Venture outlined in Resolution 2026-48.
          </p>
          <p style="margin: 0 0 14px 0;">
            Following a comprehensive review by our risk management committee and legal counsel, we are confident that this synergy combines Vanguard Capital's exceptional distribution network with our proprietary cloud automation technology to deliver unmatched market value.
          </p>
          <p style="margin: 0 0 14px 0;">
            Our lead executive team has been instructed to facilitate seamless execution of all transitional milestones starting October 1st, 2026. Please find enclosed the bilateral execution protocols signed by our authorized officers.
          </p>
          <p style="margin: 0;">
            We look forward to a mutually transformative and prosperous collaboration.
          </p>
        </div>

        <!-- Sign-off -->
        <div style="margin-top: 30px; font-size: 14px;">
          <p style="margin: 0 0 20px 0;">Sincerely yours,</p>
          <div style="height: 40px; margin-bottom: 4px;">
            <!-- Placeholder for digital signature graphic -->
            <span style="font-family: 'Brush Script MT', cursive; font-size: 26px; color: #1e3a8a;">Arthur Montgomery</span>
          </div>
          <strong style="display: block; color: #0f172a;">Arthur Montgomery</strong>
          <span style="color: #64748b; font-size: 12px; font-family: 'Segoe UI', Arial, sans-serif;">
            Chief Executive Officer & Chairman of the Board<br>
            Apex Enterprises Ltd
          </span>
        </div>
      </div>
    `,
  },
];
