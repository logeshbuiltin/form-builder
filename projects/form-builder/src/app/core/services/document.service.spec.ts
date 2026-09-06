import { TestBed } from '@angular/core/testing';
import { DocumentService } from './document.service';
import { Document } from '../domain/document.model';
import { RbacService } from './rbac.service';
import { TenantWorkspaceService } from './tenant-workspace.service';

describe('DocumentService (Phase 7: Document Instance Layer)', () => {
  let service: DocumentService;
  let rbacService: RbacService;

  beforeEach(() => {
    localStorage.removeItem('form_builder_documents_v1');
    localStorage.removeItem('form_builder_rbac_user_id');
    TestBed.configureTestingModule({
      providers: [DocumentService, TenantWorkspaceService, RbacService],
    });
    rbacService = TestBed.inject(RbacService);
    rbacService.resetToDefaults();
    service = TestBed.inject(DocumentService);
  });

  afterEach(() => {
    localStorage.removeItem('form_builder_documents_v1');
    localStorage.removeItem('form_builder_rbac_user_id');
  });

  it('should be created and populate initial seeded documents', () => {
    expect(service).toBeTruthy();
    const docs = service.getDocuments();
    expect(docs.length).toBeGreaterThanOrEqual(4);

    const physio = docs.find((d) => d.category === 'physiotherapy');
    expect(physio).toBeDefined();
    expect(physio?.patientName).toBe('Max Mustermann');
    expect(physio?.status).toBe('reviewed');
  });

  it('should generate and save a new document by merging template and payload data', () => {
    const templateHtml = `
      <div class="patient-doc">
        <h1>{{hospital.name}}</h1>
        <p>Patient: {{patient.name}} (DOB: {{patient.dob}})</p>
        <p>MRN: {{patient.mrn}}</p>
        <p>Diagnosis: {{clinical.diagnosis}}</p>
      </div>
    `;

    const payload = {
      hospital: { name: 'Charité Universitätsmedizin Berlin' },
      patient: { name: 'Erika Musterfrau', dob: '1990-01-01', mrn: 'MRN-BER-4012' },
      clinical: { diagnosis: 'Akute Bronchitis' },
    };

    const doc = service.generateAndSaveDocument({
      templateId: 'tmpl_clinical_intake',
      templateName: 'Clinical Intake Form',
      title: 'Charité Intake - Erika Musterfrau',
      templateHtml,
      payload,
      category: 'clinical_documents',
      documentType: 'intake-form',
      options: { actor: 'Dr. Anna Schmidt', initialStatus: 'rendered' },
    });

    expect(doc).toBeTruthy();
    expect(doc.id).toContain('DOC-');
    expect(doc.title).toBe('Charité Intake - Erika Musterfrau');
    expect(doc.patientName).toBe('Erika Musterfrau');
    expect(doc.patientMrn).toBe('MRN-BER-4012');
    expect(doc.status).toBe('rendered');

    // Verify Handlebars data binding merged properly into rendered HTML
    expect(doc.renderedHtml).toContain('Charité Universitätsmedizin Berlin');
    expect(doc.renderedHtml).toContain('Erika Musterfrau');
    expect(doc.renderedHtml).toContain('MRN-BER-4012');
    expect(doc.renderedHtml).toContain('Akute Bronchitis');

    // Check audit trail
    expect(doc.auditTrail.length).toBe(1);
    expect(doc.auditTrail[0].action).toBe('created');
    expect(doc.auditTrail[0].actor).toBe('Dr. Anna Schmidt');

    // Check retrieval
    const fetched = service.getDocumentById(doc.id);
    expect(fetched).toBeDefined();
    expect(fetched?.title).toBe(doc.title);
  });

  it('should update payload, re-render HTML, and record audit trail', () => {
    const templateHtml = '<p>Patient: {{patient.name}}, Vitals: {{vitals.bp}}</p>';
    const doc = service.generateAndSaveDocument({
      templateId: 'vitals_tmpl',
      title: 'Vitals Record',
      templateHtml,
      payload: { patient: { name: 'Lukas Meyer' }, vitals: { bp: '120/80' } },
    });

    expect(doc.renderedHtml).toContain('120/80');

    // Update payload with new blood pressure
    const updated = service.updatePayloadAndReRender(
      doc.id,
      { patient: { name: 'Lukas Meyer' }, vitals: { bp: '135/88' } },
      'Nurse Practitioner',
      'Re-checked blood pressure'
    );

    expect(updated).toBeDefined();
    expect(updated?.renderedHtml).toContain('135/88');
    expect(updated?.auditTrail.length).toBe(2);
    expect(updated?.auditTrail[1].action).toBe('updated');
    expect(updated?.auditTrail[1].actor).toBe('Nurse Practitioner');
  });

  it('should manage status lifecycle (draft -> reviewed -> signed)', () => {
    const doc = service.generateAndSaveDocument({
      templateId: 'consent_tmpl',
      title: 'Surgical Consent',
      templateHtml: '<p>Consent Form</p>',
      payload: { patient: { name: 'Hans Meier' } },
      options: { initialStatus: 'draft' },
    });

    expect(doc.status).toBe('draft');

    // Transition to reviewed
    service.updateDocumentStatus(doc.id, 'reviewed', 'Dr. Senior Attending', 'Pre-op review completed');
    let fetched = service.getDocumentById(doc.id);
    expect(fetched?.status).toBe('reviewed');

    // Transition to signed
    service.updateDocumentStatus(doc.id, 'signed', 'Prof. Chief Surgeon', 'Signed electronically in theater');
    fetched = service.getDocumentById(doc.id);
    expect(fetched?.status).toBe('signed');
    expect(fetched?.signedAt).toBeDefined();
    expect(fetched?.signedBy).toBe('Prof. Chief Surgeon');
    expect(fetched?.auditTrail.length).toBe(3);
  });

  it('should execute batch document generation for multiple patient records', () => {
    const templateHtml = '<p>Discharge Notice for {{patient.name}} (DOB: {{patient.dob}})</p>';
    const records = [
      { patient: { name: 'Patient One', dob: '1970-01-01' } },
      { patient: { name: 'Patient Two', dob: '1980-02-02' } },
      { patient: { name: 'Patient Three', dob: '1990-03-03' } },
    ];

    const result = service.batchGenerate({
      templateId: 'batch_discharge',
      templateName: 'Discharge Slip',
      templateHtml,
      records,
      titlePattern: 'Discharge - {{patient.name}}',
    });

    expect(result.totalProcessed).toBe(3);
    expect(result.successful).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.documents.length).toBe(3);

    expect(result.documents[0].title).toBe('Discharge - Patient One');
    expect(result.documents[0].renderedHtml).toContain('Patient One');
    expect(result.documents[1].title).toBe('Discharge - Patient Two');
    expect(result.documents[2].title).toBe('Discharge - Patient Three');
  });

  it('should delete a document instance when permitted', () => {
    const docs = service.getDocuments();
    const target = docs[0];

    const deleted = service.deleteDocument(target.id);
    expect(deleted).toBeTrue();
    expect(service.getDocumentById(target.id)).toBeUndefined();
  });

  it('should throw access denied error when generating document without document:generate permission', () => {
    rbacService.simulateRole('viewer'); // viewer has template:view, document:view, audit:view, but NO document:generate
    expect(() => {
      service.generateAndSaveDocument({
        templateId: 'tmpl_denied',
        title: 'Unauthorized Doc',
        templateHtml: '<p>Test</p>',
        payload: {},
      });
    }).toThrowError(/Missing required permission document:generate/);
  });

  it('should throw access denied error when deleting document without document:delete permission', () => {
    const docs = service.getDocuments();
    const target = docs[0];

    rbacService.simulateRole('healthcare_staff'); // healthcare_staff can generate and view, but CANNOT delete
    expect(() => {
      service.deleteDocument(target.id);
    }).toThrowError(/Missing required permission document:delete/);
  });
});
