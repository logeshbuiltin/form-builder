import { TestBed } from '@angular/core/testing';
import { PdfExportService, PdfExportOptions } from './pdf-export.service';

describe('PdfExportService', () => {
  let service: PdfExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PdfExportService],
    });
    service = TestBed.inject(PdfExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('buildPrintHtml', () => {
    const sampleContent = '<div class="clinical-section"><h2>Patient Findings</h2><p>Normal blood pressure 120/80.</p></div>';

    it('should generate valid standalone HTML including content and default styles', () => {
      const html = service.buildPrintHtml(sampleContent);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="de">');
      expect(html).toContain(sampleContent);
      expect(html).toContain('@page');
      expect(html).toContain('A4 portrait');
    });

    it('should configure custom page size and orientation', () => {
      const options: PdfExportOptions = {
        pageSize: 'Letter',
        orientation: 'landscape',
        documentTitle: 'Cardiology Discharge Summary',
      };
      const html = service.buildPrintHtml(sampleContent, options);
      expect(html).toContain('Letter landscape');
      expect(html).toContain('Cardiology Discharge Summary');
    });

    it('should configure margins appropriately', () => {
      const compactHtml = service.buildPrintHtml(sampleContent, { margins: 'compact' });
      expect(compactHtml).toContain('margin: 8mm 8mm 10mm 8mm;');

      const wideHtml = service.buildPrintHtml(sampleContent, { margins: 'wide' });
      expect(wideHtml).toContain('margin: 25mm 20mm 25mm 20mm;');
    });

    it('should render watermark overlays for built-in and custom watermark types', () => {
      const confHtml = service.buildPrintHtml(sampleContent, { watermark: 'confidential' });
      expect(confHtml).toContain('CONFIDENTIAL / VERTRAULICH');

      const draftHtml = service.buildPrintHtml(sampleContent, { watermark: 'draft' });
      expect(draftHtml).toContain('ENTWURF / DRAFT');

      const customHtml = service.buildPrintHtml(sampleContent, {
        watermark: 'custom',
        customWatermarkText: 'INTERNAL AUDIT ONLY',
      });
      expect(customHtml).toContain('INTERNAL AUDIT ONLY');

      const noneHtml = service.buildPrintHtml(sampleContent, { watermark: 'none' });
      expect(noneHtml).not.toContain('<div class="print-watermark-overlay"');
    });

    it('should generate verification QR and barcode SVGs when requested', () => {
      const html = service.buildPrintHtml(sampleContent, {
        includeVerificationQr: true,
        verificationCode: 'DOC-TEST-XYZ',
        includeBarcode: true,
        barcodeValue: 'MRN-998877',
      });

      expect(html).toContain('<svg width="70" height="70"');
      expect(html).toContain('MRN-998877');
    });

    it('should omit header and footer when toggled off', () => {
      const html = service.buildPrintHtml(sampleContent, {
        includeHeader: false,
        includeFooter: false,
      });

      expect(html).not.toContain('class="print-running-header"');
      expect(html).not.toContain('class="print-running-footer"');
    });
  });

  describe('generateSvgBarcode', () => {
    it('should return SVG markup with specified width and height', () => {
      const svg = service.generateSvgBarcode('MRN-12345', 180, 50);
      expect(svg).toContain('<svg width="180" height="50"');
      expect(svg).toContain('<rect');
      expect(svg).toContain('MRN-12345');
    });
  });

  describe('generateSvgQrCode', () => {
    it('should return SVG markup containing finder patterns and QR grid cells', () => {
      const svg = service.generateSvgQrCode('https://clinic.example/verify/12345', 80);
      expect(svg).toContain('<svg width="80" height="80"');
      expect(svg).toContain('viewBox="0 0 80 80"');
      expect(svg).toContain('<rect');
    });
  });

  describe('exportStandalonePrintHtml & triggerPrint', () => {
    it('should trigger print without throwing an error', () => {
      expect(() => {
        service.triggerPrint('<p>Test Print</p>');
      }).not.toThrow();
    });

    it('should create a download link for standalone print html', () => {
      const createElementSpy = spyOn(document, 'createElement').and.callThrough();
      service.exportStandalonePrintHtml('<p>Test HTML</p>', { documentTitle: 'Test Doc' }, 'test_file');
      expect(createElementSpy).toHaveBeenCalledWith('a');
    });
  });
});
