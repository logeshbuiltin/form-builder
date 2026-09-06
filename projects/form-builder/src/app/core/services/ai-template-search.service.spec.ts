import { TestBed } from '@angular/core/testing';
import { AITemplateSearchService } from './ai-template-search.service';
import { DOCUMENT_FORMATS } from '../../data/constant/document-formats.constant';

describe('AITemplateSearchService (Phase 5)', () => {
  let service: AITemplateSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AITemplateSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Natural Language Attribute Extraction', () => {
    it('should extract all 5 attributes from the Master Plan example prompt', () => {
      const prompt = 'I need a German physiotherapy initial assessment form for adults.';
      const attrs = service.extractAttributes(prompt);

      expect(attrs.industry).toBe('Physiotherapy');
      expect(attrs.documentType).toBe('Initial assessment');
      expect(attrs.country).toBe('Germany');
      expect(attrs.language).toBe('German');
      expect(attrs.audience).toBe('Adult');
    });

    it('should extract attributes from German natural language queries', () => {
      const prompt = 'Ich brauche einen physiotherapie erstbefund für erwachsene auf deutsch';
      const attrs = service.extractAttributes(prompt);

      expect(attrs.industry).toBe('Physiotherapy');
      expect(attrs.documentType).toBe('Initial assessment');
      expect(attrs.language).toBe('German');
      expect(attrs.audience).toBe('Adult');
    });

    it('should extract dental industry and examination document type', () => {
      const prompt = 'Create a dental exam and treatment plan';
      const attrs = service.extractAttributes(prompt);

      expect(attrs.industry).toBe('Dental');
      expect(attrs.documentType).toBe('Examination report');
    });

    it('should extract pediatric audience and consent document type', () => {
      const prompt = 'Pediatric procedure consent form in English';
      const attrs = service.extractAttributes(prompt);

      expect(attrs.audience).toBe('Pediatric');
      expect(attrs.documentType).toBe('Consent form');
      expect(attrs.language).toBe('English');
    });

    it('should extract billing and invoice attributes', () => {
      const prompt = 'Medical invoice and patient billing statement';
      const attrs = service.extractAttributes(prompt);

      expect(attrs.documentType).toBe('Invoice');
      expect(attrs.industry).toBe('Administrative');
    });
  });

  describe('Search, Ranking & Recommendation Reason', () => {
    it('should recommend the physiotherapy assessment template with high confidence for Master Plan query', () => {
      const query = 'I need a German physiotherapy initial assessment form for adults.';
      const response = service.search(query, DOCUMENT_FORMATS);

      expect(response.totalFound).toBeGreaterThan(0);
      expect(response.searchMode).toBe('deterministic_metadata');
      expect(response.results.length).toBeGreaterThan(0);

      const topResult = response.results[0];
      expect(topResult.template.id).toBe('physio_assessment');
      expect(topResult.score).toBeGreaterThan(80);
      expect(topResult.matchReason).toContain('Physiotherapy');
      expect(topResult.matchReason).toContain('Initial assessment');
      expect(topResult.matchedAttributes.industry).toBe('Physiotherapy');
      expect(topResult.matchedAttributes.documentType).toBe('Initial assessment');
      expect(topResult.matchedAttributes.country).toBe('Germany');
      expect(topResult.matchedAttributes.language).toBe('German');
      expect(topResult.matchedAttributes.audience).toBe('Adult');
    });

    it('should rank dental examination template #1 for dental query', () => {
      const query = 'Dental treatment plan and teeth examination';
      const response = service.search(query, DOCUMENT_FORMATS);

      expect(response.results.length).toBeGreaterThan(0);
      const top = response.results[0];
      expect(top.template.id).toBe('dental_exam');
      expect(top.matchedAttributes.industry).toBe('Dental');
    });

    it('should rank laboratory report template #1 for lab blood test query', () => {
      const query = 'Pathology laboratory report for metabolic blood panel';
      const response = service.search(query, DOCUMENT_FORMATS);

      expect(response.results.length).toBeGreaterThan(0);
      const top = response.results[0];
      expect(top.template.id).toBe('lab_report');
      expect(top.score).toBeGreaterThan(60);
    });

    it('should provide transparent, human-readable match reasons for every returned recommendation', () => {
      const query = 'Hospital inpatient discharge summary';
      const response = service.search(query, DOCUMENT_FORMATS);

      expect(response.results.length).toBeGreaterThan(0);
      for (const res of response.results) {
        expect(res.matchReason).toBeTruthy();
        expect(res.score).toBeGreaterThan(0);
        expect(res.score).toBeLessThanOrEqual(100);
      }

      const top = response.results[0];
      expect(top.template.id).toBe('discharge_summary');
      expect(top.matchReason.toLowerCase()).toContain('discharge summary');
    });
  });
});
