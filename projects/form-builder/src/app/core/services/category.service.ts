import { Injectable } from '@angular/core';
import { CategoryDefinition, DocumentTypeDefinition } from '../domain/category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly storageKey = 'form_builder_categories_v1';

  /**
   * Phase 4 Initial Healthcare & Administrative Categories.
   * Fully configurable — users and workspaces can add, modify, or extend these.
   */
  private readonly defaultCategories: CategoryDefinition[] = [
    {
      id: 'patient_forms',
      name: 'Patient Forms',
      description: 'Patient onboarding, intake, consent, and registration forms',
      industry: 'healthcare',
      icon: 'fa fa-id-card-o',
      badgeColor: '#2563eb',
      isBuiltIn: true,
      sortOrder: 1,
      documentTypes: [
        { id: 'patient_registration', name: 'Patient Registration', categoryId: 'patient_forms', tags: ['intake', 'demographics', 'registration'] },
        { id: 'medical_history', name: 'Medical History', categoryId: 'patient_forms', tags: ['history', 'anamnesis', 'clinical'] },
        { id: 'consent_form', name: 'Consent Form', categoryId: 'patient_forms', tags: ['consent', 'legal', 'authorization'] },
        { id: 'intake_form', name: 'Intake Form', categoryId: 'patient_forms', tags: ['intake', 'assessment', 'adult'] },
        { id: 'questionnaire', name: 'Health Questionnaire', categoryId: 'patient_forms', tags: ['screening', 'survey', 'patient'] },
      ],
    },
    {
      id: 'clinical_documents',
      name: 'Clinical Documents',
      description: 'Formal medical records, consultation notes, and discharge reports',
      industry: 'healthcare',
      icon: 'fa fa-stethoscope',
      badgeColor: '#0f766e',
      isBuiltIn: true,
      sortOrder: 2,
      documentTypes: [
        { id: 'consultation_report', name: 'Consultation Report', categoryId: 'clinical_documents', tags: ['consultation', 'physician', 'notes'] },
        { id: 'examination_report', name: 'Examination Report', categoryId: 'clinical_documents', tags: ['physical', 'exam', 'findings'] },
        { id: 'referral_letter', name: 'Referral Letter', categoryId: 'clinical_documents', tags: ['referral', 'doctor', 'specialist'] },
        { id: 'follow_up_report', name: 'Follow-up Report', categoryId: 'clinical_documents', tags: ['followup', 'progress', 'review'] },
        { id: 'treatment_summary', name: 'Treatment Summary', categoryId: 'clinical_documents', tags: ['treatment', 'therapy', 'summary'] },
        { id: 'discharge_summary', name: 'Discharge Summary', categoryId: 'clinical_documents', tags: ['discharge', 'hospital', 'orders'] },
      ],
    },
    {
      id: 'dental',
      name: 'Dental',
      description: 'Dentistry consultations, odontograms, and treatment proposals',
      industry: 'dental',
      icon: 'fa fa-smile-o',
      badgeColor: '#0284c7',
      isBuiltIn: true,
      sortOrder: 3,
      documentTypes: [
        { id: 'dental_examination', name: 'Dental Examination', categoryId: 'dental', tags: ['oral', 'dental', 'examination'] },
        { id: 'dental_treatment_plan', name: 'Treatment Plan', categoryId: 'dental', tags: ['treatment', 'dental', 'estimate'] },
        { id: 'dental_consent', name: 'Dental Procedure Consent', categoryId: 'dental', tags: ['consent', 'surgery', 'dental'] },
      ],
    },
    {
      id: 'physiotherapy',
      name: 'Physiotherapy',
      description: 'Physical therapy assessments, rehab plans, and mobility logs',
      industry: 'physiotherapy',
      icon: 'fa fa-heartbeat',
      badgeColor: '#7c3aed',
      isBuiltIn: true,
      sortOrder: 4,
      documentTypes: [
        { id: 'physio_initial_assessment', name: 'Initial Assessment', categoryId: 'physiotherapy', tags: ['physiotherapy', 'assessment', 'rehab'] },
        { id: 'physio_treatment_plan', name: 'Treatment Plan', categoryId: 'physiotherapy', tags: ['exercise', 'plan', 'mobility'] },
        { id: 'physio_progress_report', name: 'Progress Report', categoryId: 'physiotherapy', tags: ['progress', 'rehab', 'milestones'] },
        { id: 'physio_discharge_report', name: 'Discharge Report', categoryId: 'physiotherapy', tags: ['discharge', 'recovery', 'completion'] },
      ],
    },
    {
      id: 'laboratory',
      name: 'Laboratory',
      description: 'Lab test requisitions, pathology panels, and diagnostic outputs',
      industry: 'laboratory',
      icon: 'fa fa-flask',
      badgeColor: '#d97706',
      isBuiltIn: true,
      sortOrder: 5,
      documentTypes: [
        { id: 'lab_test_request', name: 'Test Request', categoryId: 'laboratory', tags: ['requisition', 'order', 'specimen'] },
        { id: 'laboratory_report', name: 'Laboratory Report', categoryId: 'laboratory', tags: ['results', 'pathology', 'blood'] },
        { id: 'lab_results_summary', name: 'Results Summary', categoryId: 'laboratory', tags: ['summary', 'diagnostic', 'trends'] },
      ],
    },
    {
      id: 'administrative',
      name: 'Administrative',
      description: 'Invoicing, billing, receipts, and clinical appointment notices',
      industry: 'administrative',
      icon: 'fa fa-file-text-o',
      badgeColor: '#059669',
      isBuiltIn: true,
      sortOrder: 6,
      documentTypes: [
        { id: 'admin_invoice', name: 'Medical Invoice', categoryId: 'administrative', tags: ['invoice', 'billing', 'fee'] },
        { id: 'admin_receipt', name: 'Official Receipt', categoryId: 'administrative', tags: ['receipt', 'payment', 'paid'] },
        { id: 'admin_quotation', name: 'Treatment Quotation', categoryId: 'administrative', tags: ['quote', 'estimate', 'cost'] },
        { id: 'admin_appointment_confirmation', name: 'Appointment Confirmation', categoryId: 'administrative', tags: ['appointment', 'confirmation', 'booking'] },
      ],
    },
  ];

  private categories: CategoryDefinition[] = [];

  constructor() {
    this.loadCategories();
  }

  /**
   * Retrieves all configured categories sorted by sortOrder.
   */
  public getCategories(): CategoryDefinition[] {
    return [...this.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Retrieves a category by its unique ID.
   */
  public getCategoryById(id: string): CategoryDefinition | undefined {
    return this.categories.find((c) => c.id === id);
  }

  /**
   * Retrieves all categories for a specific industry or 'general'.
   */
  public getCategoriesByIndustry(industry: string): CategoryDefinition[] {
    if (!industry || industry === 'all') return this.getCategories();
    return this.categories.filter((c) => c.industry === industry || c.industry === 'general');
  }

  /**
   * Retrieves all document types for a specific category.
   */
  public getDocumentTypesByCategory(categoryId: string): DocumentTypeDefinition[] {
    const cat = this.getCategoryById(categoryId);
    return cat ? cat.documentTypes : [];
  }

  /**
   * Creates or updates a category.
   */
  public saveCategory(category: CategoryDefinition): CategoryDefinition {
    const existingIndex = this.categories.findIndex((c) => c.id === category.id);
    if (existingIndex >= 0) {
      this.categories[existingIndex] = { ...category };
    } else {
      this.categories.push({ ...category });
    }
    this.persistCategories();
    return category;
  }

  /**
   * Adds a new document type to a category.
   */
  public addDocumentType(categoryId: string, docType: DocumentTypeDefinition): boolean {
    const cat = this.getCategoryById(categoryId);
    if (!cat) return false;

    const existingIdx = cat.documentTypes.findIndex((d) => d.id === docType.id);
    if (existingIdx >= 0) {
      cat.documentTypes[existingIdx] = docType;
    } else {
      cat.documentTypes.push(docType);
    }
    this.persistCategories();
    return true;
  }

  /**
   * Deletes a user-created category. Built-in categories cannot be deleted.
   */
  public deleteCategory(id: string): boolean {
    const cat = this.getCategoryById(id);
    if (!cat || cat.isBuiltIn) return false;

    this.categories = this.categories.filter((c) => c.id !== id);
    this.persistCategories();
    return true;
  }

  /**
   * Evaluates if a template/format's category matches the selected category filter.
   * Handles both exact IDs and legacy category fallbacks.
   */
  public isFormatMatchingCategory(formatCategory: string, selectedCategoryId: string): boolean {
    if (!selectedCategoryId || selectedCategoryId === 'all') {
      return true;
    }
    if (formatCategory === selectedCategoryId) {
      return true;
    }

    // Fallback mappings for backward compatibility
    if (selectedCategoryId === 'clinical_documents' && (formatCategory === 'medical' || formatCategory === 'clinical')) {
      return true;
    }
    if (selectedCategoryId === 'administrative' && (formatCategory === 'finance' || formatCategory === 'corporate')) {
      return true;
    }
    if (selectedCategoryId === 'patient_forms' && (formatCategory === 'patient' || formatCategory === 'medical')) {
      return true;
    }

    return false;
  }

  /**
   * Exports all category configurations as a JSON string.
   */
  public exportCategoriesJson(): string {
    return JSON.stringify(this.categories, null, 2);
  }

  /**
   * Imports category configurations from a JSON string.
   */
  public importCategoriesJson(json: string): boolean {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed) && parsed.length > 0) {
        this.categories = parsed;
        this.persistCategories();
        return true;
      }
    } catch {
      // invalid JSON
    }
    return false;
  }

  /**
   * Resets all categories to factory defaults.
   */
  public resetToDefaults(): void {
    this.categories = JSON.parse(JSON.stringify(this.defaultCategories));
    this.persistCategories();
  }

  private loadCategories(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.categories = parsed;
          return;
        }
      }
    } catch {
      // fallback to defaults
    }
    this.categories = JSON.parse(JSON.stringify(this.defaultCategories));
  }

  private persistCategories(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.categories));
    } catch (e) {
      console.warn('Could not persist template categories', e);
    }
  }
}
