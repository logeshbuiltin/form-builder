import { TestBed } from '@angular/core/testing';
import { AITemplateGenerationService } from './ai-template-generation.service';
import { TemplateIR } from '../domain/template-ir.model';

describe('AITemplateGenerationService (Phase 6)', () => {
  let service: AITemplateGenerationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AITemplateGenerationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Master Plan Benchmark: German Physiotherapy Intake Form', () => {
    const prompt = 'Create a German physiotherapy patient intake form.';

    it('should generate a structured Intermediate Representation (IR), NOT raw arbitrary code', () => {
      const ir = service.generateTemplateIR(prompt);

      expect(ir).toBeTruthy();
      expect(typeof ir).toBe('object');
      expect(ir.templateType).toBe('form');
      expect(ir.industry).toBe('physiotherapy');
      expect(ir.category).toBe('patient_forms');
      expect(ir.language).toBe('German');
      expect(ir.title).toContain('Physiotherapie');

      // Sections verification
      expect(ir.sections.length).toBeGreaterThanOrEqual(5);

      const sectionTitles = ir.sections.map((s) => s.title);
      expect(sectionTitles.some((t) => t.includes('Patientendaten'))).toBeTrue();
      expect(sectionTitles.some((t) => t.includes('Anamnese'))).toBeTrue();
      expect(sectionTitles.some((t) => t.includes('Warnhinweise'))).toBeTrue();
      expect(sectionTitles.some((t) => t.includes('ROM') || t.includes('Bewegungsbefund'))).toBeTrue();
      expect(sectionTitles.some((t) => t.includes('Unterschriften'))).toBeTrue();
    });

    it('should pass structural validation for generated IR', () => {
      const ir = service.generateTemplateIR(prompt);
      const validation = service.validateIR(ir);

      expect(validation.valid).toBeTrue();
      expect(validation.errors.length).toBe(0);
    });

    it('should compile the structured IR into safe, styled HTML with variables and tables', () => {
      const ir = service.generateTemplateIR(prompt);
      const html = service.compileIRToHtml(ir);

      expect(html).toContain('doc-page ai-generated-template');
      expect(html).toContain('{{patient.name}}');
      expect(html).toContain('{{patient.dob}}');
      expect(html).toContain('{{pain_score}}');
      expect(html).toContain('<table');
      expect(html).toContain('PRAXIS FÜR PHYSIOTHERAPIE & REHABILITATION');
      expect(html).toContain('Unterschrift');
    });
  });

  describe('Other Healthcare IR Domain Generators', () => {
    it('should generate structured Dental Examination IR with tooth charting table', () => {
      const ir = service.generateTemplateIR('Create a dental examination and treatment plan');

      expect(ir.industry).toBe('dental');
      expect(ir.sections.some((s) => s.layout === 'table' && s.tableColumns?.some((c) => c.key === 'tooth'))).toBeTrue();

      const html = service.compileIRToHtml(ir);
      expect(html).toContain('DENTAL');
      expect(html).toContain('{{dentist_name}}');
    });

    it('should generate structured Consent Form IR with risk callouts and dual signatures', () => {
      const ir = service.generateTemplateIR('Informed procedure consent form');

      expect(ir.category).toBe('patient_forms');
      expect(ir.sections.some((s) => s.layout === 'alert')).toBeTrue();
      expect(ir.sections.some((s) => s.fields.some((f) => f.type === 'signature'))).toBeTrue();

      const html = service.compileIRToHtml(ir);
      expect(html).toContain('{{procedure.name}}');
      expect(html).toContain('{{doctor.name}}');
    });

    it('should generate structured Discharge Summary IR with medications table', () => {
      const ir = service.generateTemplateIR('Hospital clinical discharge summary');

      expect(ir.category).toBe('clinical_documents');
      expect(ir.sections.some((s) => s.layout === 'table')).toBeTrue();

      const html = service.compileIRToHtml(ir);
      expect(html).toContain('{{admission_date}}');
      expect(html).toContain('{{discharge_date}}');
    });
  });

  describe('Validation Robustness', () => {
    it('should flag invalid IR missing title or sections', () => {
      const badIR: TemplateIR = {
        id: '',
        title: '',
        templateType: 'form',
        industry: 'healthcare',
        category: 'clinical',
        language: 'English',
        sections: [],
      };

      const result = service.validateIR(badIR);
      expect(result.valid).toBeFalse();
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });
});
