import { TestBed } from '@angular/core/testing';
import { CategoryService } from './category.service';
import { CategoryDefinition } from '../domain/category.model';

describe('CategoryService (Phase 4)', () => {
  let service: CategoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CategoryService);
    service.resetToDefaults();
  });

  it('should initialize with all 6 required Phase 4 categories', () => {
    const categories = service.getCategories();
    const ids = categories.map((c) => c.id);

    expect(ids).toContain('patient_forms');
    expect(ids).toContain('clinical_documents');
    expect(ids).toContain('dental');
    expect(ids).toContain('physiotherapy');
    expect(ids).toContain('laboratory');
    expect(ids).toContain('administrative');
    expect(categories.length).toBe(6);
  });

  it('should support initial document types for Patient Forms', () => {
    const docTypes = service.getDocumentTypesByCategory('patient_forms');
    const ids = docTypes.map((d) => d.id);

    expect(ids).toContain('patient_registration');
    expect(ids).toContain('medical_history');
    expect(ids).toContain('consent_form');
    expect(ids).toContain('intake_form');
    expect(ids).toContain('questionnaire');
  });

  it('should support initial document types for Clinical Documents', () => {
    const docTypes = service.getDocumentTypesByCategory('clinical_documents');
    const ids = docTypes.map((d) => d.id);

    expect(ids).toContain('consultation_report');
    expect(ids).toContain('examination_report');
    expect(ids).toContain('referral_letter');
    expect(ids).toContain('follow_up_report');
    expect(ids).toContain('treatment_summary');
    expect(ids).toContain('discharge_summary');
  });

  it('should support initial document types for Dental & Physiotherapy', () => {
    const dentalTypes = service.getDocumentTypesByCategory('dental').map((d) => d.id);
    expect(dentalTypes).toContain('dental_examination');
    expect(dentalTypes).toContain('dental_treatment_plan');
    expect(dentalTypes).toContain('dental_consent');

    const physioTypes = service.getDocumentTypesByCategory('physiotherapy').map((d) => d.id);
    expect(physioTypes).toContain('physio_initial_assessment');
    expect(physioTypes).toContain('physio_treatment_plan');
    expect(physioTypes).toContain('physio_progress_report');
    expect(physioTypes).toContain('physio_discharge_report');
  });

  it('should support initial document types for Laboratory & Administrative', () => {
    const labTypes = service.getDocumentTypesByCategory('laboratory').map((d) => d.id);
    expect(labTypes).toContain('lab_test_request');
    expect(labTypes).toContain('laboratory_report');
    expect(labTypes).toContain('lab_results_summary');

    const adminTypes = service.getDocumentTypesByCategory('administrative').map((d) => d.id);
    expect(adminTypes).toContain('admin_invoice');
    expect(adminTypes).toContain('admin_receipt');
    expect(adminTypes).toContain('admin_quotation');
    expect(adminTypes).toContain('admin_appointment_confirmation');
  });

  it('should allow dynamically adding and configuring a custom category', () => {
    const custom: CategoryDefinition = {
      id: 'radiology',
      name: 'Radiology & Imaging',
      description: 'X-Ray, MRI, CT scan reports and radiologist assessments',
      industry: 'healthcare',
      icon: 'fa fa-film',
      isBuiltIn: false,
      sortOrder: 7,
      documentTypes: [
        { id: 'mri_report', name: 'MRI Brain & Spine Report', categoryId: 'radiology', tags: ['mri', 'imaging'] },
      ],
    };

    service.saveCategory(custom);
    const retrieved = service.getCategoryById('radiology');
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Radiology & Imaging');
    expect(retrieved?.documentTypes.length).toBe(1);
  });

  it('should prevent deleting built-in categories while permitting deletion of custom categories', () => {
    expect(service.deleteCategory('patient_forms')).toBeFalse();
    expect(service.getCategoryById('patient_forms')).toBeDefined();

    const custom: CategoryDefinition = {
      id: 'optometry',
      name: 'Optometry',
      industry: 'healthcare',
      icon: 'fa fa-eye',
      isBuiltIn: false,
      sortOrder: 8,
      documentTypes: [],
    };
    service.saveCategory(custom);
    expect(service.deleteCategory('optometry')).toBeTrue();
    expect(service.getCategoryById('optometry')).toBeUndefined();
  });

  it('should match format categories with legacy fallbacks correctly', () => {
    expect(service.isFormatMatchingCategory('patient_forms', 'all')).toBeTrue();
    expect(service.isFormatMatchingCategory('patient_forms', 'patient_forms')).toBeTrue();
    expect(service.isFormatMatchingCategory('medical', 'clinical_documents')).toBeTrue();
    expect(service.isFormatMatchingCategory('finance', 'administrative')).toBeTrue();
    expect(service.isFormatMatchingCategory('dental', 'physiotherapy')).toBeFalse();
  });

  it('should export and import category configurations correctly', () => {
    const json = service.exportCategoriesJson();
    expect(json).toContain('patient_forms');
    expect(json).toContain('clinical_documents');

    const imported = service.importCategoriesJson(json);
    expect(imported).toBeTrue();
    expect(service.getCategories().length).toBe(6);
  });
});
