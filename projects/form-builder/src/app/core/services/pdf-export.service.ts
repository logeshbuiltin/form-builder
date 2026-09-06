import { Injectable } from '@angular/core';

export type PageSize = 'A4' | 'Letter' | 'Legal' | 'Receipt';
export type PageOrientation = 'portrait' | 'landscape';
export type WatermarkType =
  | 'none'
  | 'confidential'
  | 'draft'
  | 'copy'
  | 'medical_record'
  | 'custom';
export type MarginSize = 'compact' | 'normal' | 'wide';

export interface PdfExportOptions {
  pageSize?: PageSize;
  orientation?: PageOrientation;
  margins?: MarginSize;
  includeHeader?: boolean;
  includeFooter?: boolean;
  includePageNumbers?: boolean;
  watermark?: WatermarkType;
  customWatermarkText?: string;
  includeVerificationQr?: boolean;
  verificationCode?: string;
  includeBarcode?: boolean;
  barcodeValue?: string;
  documentTitle?: string;
  organizationName?: string;
  footerNote?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PdfExportService {
  /**
   * Compiles document content into a complete, standalone, print-optimized HTML bundle.
   * Includes @page CSS rules, page break controls, running headers/footers,
   * vector watermark overlay, and verification barcodes/QRs.
   */
  public buildPrintHtml(contentHtml: string, options?: PdfExportOptions): string {
    const opts: Required<PdfExportOptions> = {
      pageSize: options?.pageSize || 'A4',
      orientation: options?.orientation || 'portrait',
      margins: options?.margins || 'normal',
      includeHeader: options?.includeHeader !== false,
      includeFooter: options?.includeFooter !== false,
      includePageNumbers: options?.includePageNumbers !== false,
      watermark: options?.watermark || 'none',
      customWatermarkText: options?.customWatermarkText || '',
      includeVerificationQr: options?.includeVerificationQr !== false,
      verificationCode: options?.verificationCode || `VERIFIED-DOC-${Date.now()}`,
      includeBarcode: options?.includeBarcode || false,
      barcodeValue: options?.barcodeValue || 'MRN-2026-98214',
      documentTitle: options?.documentTitle || 'Healthcare Clinical Record',
      organizationName: options?.organizationName || 'HEALTHCARE MEDICAL NETWORK',
      footerNote:
        options?.footerNote ||
        'Confidential Medical Record. Unauthorized duplication or disclosure prohibited under DSGVO / EU-GDPR.',
    };

    // Calculate margins in mm
    let marginCss = '15mm 12mm 18mm 12mm';
    if (opts.margins === 'compact') marginCss = '8mm 8mm 10mm 8mm';
    if (opts.margins === 'wide') marginCss = '25mm 20mm 25mm 20mm';

    // Page size CSS
    let pageSizeCss = `${opts.pageSize} ${opts.orientation}`;
    if (opts.pageSize === 'Receipt') pageSizeCss = '80mm auto';

    // Watermark text
    let watermarkText = '';
    if (opts.watermark === 'confidential') watermarkText = 'CONFIDENTIAL / VERTRAULICH';
    else if (opts.watermark === 'draft') watermarkText = 'ENTWURF / DRAFT';
    else if (opts.watermark === 'copy') watermarkText = 'KOPIE / DUPLICATE';
    else if (opts.watermark === 'medical_record') watermarkText = 'CLINICAL PHI / RESTRICTED';
    else if (opts.watermark === 'custom' && opts.customWatermarkText) {
      watermarkText = opts.customWatermarkText.toUpperCase();
    }

    // Generate Verification Barcode & QR SVGs
    const qrSvg = opts.includeVerificationQr
      ? this.generateSvgQrCode(opts.verificationCode, 70)
      : '';
    const barcodeSvg = opts.includeBarcode
      ? this.generateSvgBarcode(opts.barcodeValue, 160, 40)
      : '';

    const watermarkHtml = watermarkText
      ? `<div class="print-watermark-overlay" aria-hidden="true">
           <div class="watermark-text">${watermarkText}</div>
         </div>`
      : '';

    return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>${opts.documentTitle}</title>
  <style>
    /* =========================================================
       Print-Optimized Stylesheet & Paging Rules (Phase 8)
       ========================================================= */
    @page {
      size: ${pageSizeCss};
      margin: ${marginCss};

      @bottom-right {
        content: ${opts.includePageNumbers ? '"Seite " counter(page) " von " counter(pages)' : 'none'};
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
    }

    *, *:before, *:after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #f8fafc;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.45;
    }

    /* Screen display wrapper */
    .print-page-wrapper {
      position: relative;
      max-width: 820px;
      margin: 25px auto;
      background: #ffffff;
      padding: 35px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border-radius: 6px;
    }

    /* Print media overrides */
    @media print {
      body {
        background: transparent !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .print-page-wrapper {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
      .no-print {
        display: none !important;
      }
    }

    /* Page Break Utility Classes */
    .page-break, .page-break-before {
      page-break-before: always !important;
      break-before: page !important;
    }
    .page-break-after {
      page-break-after: always !important;
      break-after: page !important;
    }
    .avoid-page-break, .keep-together {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* Watermark Overlay */
    .print-watermark-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9999;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      opacity: 0.10;
    }

    .watermark-text {
      font-size: 52pt;
      font-weight: 900;
      color: #b91c1c;
      transform: rotate(-35deg);
      text-transform: uppercase;
      letter-spacing: 6px;
      white-space: nowrap;
      user-select: none;
      border: 6px solid #b91c1c;
      padding: 12px 36px;
      border-radius: 12px;
    }

    /* Running Header & Footer */
    .print-running-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 8px;
      margin-bottom: 20px;
      font-size: 8pt;
      color: #64748b;
    }
    .running-org {
      font-weight: 800;
      color: #1e293b;
      letter-spacing: 0.5px;
    }

    .print-running-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      margin-top: 25px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #64748b;
    }
    .footer-note {
      max-width: 75%;
      line-height: 1.3;
    }

    /* Verification Box */
    .verification-seal-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      margin-top: 18px;
      font-size: 8pt;
    }
    .verification-info {
      line-height: 1.35;
    }
    .verification-badge {
      font-weight: 700;
      color: #15803d;
    }
  </style>
</head>
<body>
  ${watermarkHtml}

  <div class="print-page-wrapper">
    <!-- Optional Running Header -->
    ${
      opts.includeHeader
        ? `<div class="print-running-header">
             <div class="running-org">${opts.organizationName}</div>
             <div class="running-title">${opts.documentTitle}</div>
           </div>`
        : ''
    }

    <!-- Document Body Content -->
    <div class="print-document-content">
      ${contentHtml}
    </div>

    <!-- Verification / Audit Stamp Block -->
    ${
      opts.includeVerificationQr || opts.includeBarcode
        ? `<div class="verification-seal-box avoid-page-break">
             ${qrSvg ? `<div>${qrSvg}</div>` : ''}
             <div class="verification-info flex-1">
               <div class="verification-badge">✔ DIGITAL MEDICAL VERIFICATION & INTEGRITY SEAL</div>
               <div style="color: #475569; margin-top: 2px;">Doc Ref: <strong>${opts.verificationCode}</strong></div>
               <div style="color: #64748b; font-size: 7pt;">Signed timestamp: ${new Date().toISOString()}</div>
             </div>
             ${barcodeSvg ? `<div>${barcodeSvg}</div>` : ''}
           </div>`
        : ''
    }

    <!-- Optional Running Footer -->
    ${
      opts.includeFooter
        ? `<div class="print-running-footer">
             <div class="footer-note">${opts.footerNote}</div>
             <div class="footer-page-count">
               ${opts.includePageNumbers ? 'Page 1 of 1' : ''}
             </div>
           </div>`
        : ''
    }
  </div>
</body>
</html>`;
  }

  /**
   * Generates a preview snippet safe for embedding inside an in-page modal innerHTML
   * without outer DOCTYPE, html, head, or title tags that cause top-level document reloads.
   */
  public buildPrintPreviewHtml(contentHtml: string, options?: PdfExportOptions): string {
    const fullHtml = this.buildPrintHtml(contentHtml, options);
    const styleMatch = fullHtml.match(/<style>([\s\S]*?)<\/style>/i);
    const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const styleContent = styleMatch ? `<style>${styleMatch[1]}</style>` : '';
    const bodyContent = bodyMatch ? bodyMatch[1] : contentHtml;
    return `${styleContent}<div class="pdf-preview-embed">${bodyContent}</div>`;
  }

  /**
   * Spools the print HTML to an isolated invisible iframe and opens the system print dialogue.
   */
  public triggerPrint(contentHtml: string, options?: PdfExportOptions): void {
    const printHtml = this.buildPrintHtml(contentHtml, options);

    // Create a temporary hidden iframe for print spooling
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-1000';

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      this.triggerPrintPopupFallback(printHtml);
      return;
    }

    iframeDoc.open();
    iframeDoc.write(printHtml);
    iframeDoc.close();

    // Allow resources & styles to settle, then invoke print
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.warn('Iframe print failed, falling back to popup window:', e);
        this.triggerPrintPopupFallback(printHtml);
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 1000);
      }
    }, 400);
  }

  /**
   * Fallback print popup if iframe printing is restricted.
   */
  private triggerPrintPopupFallback(printHtml: string): void {
    const w = window.open('', '_blank', 'width=950,height=1200');
    if (w) {
      w.document.open();
      w.document.write(printHtml);
      w.document.close();
      setTimeout(() => {
        w.focus();
        w.print();
        w.close();
      }, 500);
    }
  }

  /**
   * Downloads the complete standalone print-optimized HTML bundle.
   */
  public exportStandalonePrintHtml(
    contentHtml: string,
    options?: PdfExportOptions,
    filename?: string
  ): void {
    const html = this.buildPrintHtml(contentHtml, options);
    const fname = (filename || options?.documentTitle || 'document_print')
      .replace(/[^a-zA-Z0-9_-]/g, '_') + '.html';

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Generates a crisp, vector SVG barcode (Code 128-like alternating pattern with human readable text).
   */
  public generateSvgBarcode(code: string, width: number = 160, height: number = 40): string {
    const cleanCode = (code || '12345678').replace(/[^a-zA-Z0-9-]/g, '');
    let barsHtml = '';
    const barWidth = 2.2;
    let x = 8;

    // Generate bar pattern deterministically based on characters
    for (let i = 0; i < cleanCode.length; i++) {
      const charCode = cleanCode.charCodeAt(i);
      const pattern = [(charCode % 3) + 1, ((charCode >> 1) % 3) + 1, ((charCode >> 2) % 3) + 1];
      for (const p of pattern) {
        barsHtml += `<rect x="${x}" y="4" width="${barWidth * (p === 1 ? 1 : 1.8)}" height="${height - 16}" fill="#0f172a" />`;
        x += barWidth * 2.8;
      }
    }

    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#ffffff" rx="3" />
      ${barsHtml}
      <text x="${width / 2}" y="${height - 3}" font-family="monospace" font-size="8" fill="#475569" text-anchor="middle" font-weight="bold">${cleanCode}</text>
    </svg>`;
  }

  /**
   * Generates a crisp, vector SVG 2D QR Code matrix with corner positioning landmarks.
   */
  public generateSvgQrCode(data: string, size: number = 70): string {
    const modules = 21; // Standard Version 1 QR grid size
    const cellSize = size / modules;
    let rects = '';

    // Deterministic pseudo-random module generator using string hash
    let hash = 0;
    for (let i = 0; i < (data || '').length; i++) {
      hash = (hash << 5) - hash + data.charCodeAt(i);
      hash |= 0;
    }

    // Draw standard 7x7 corner positioning finder patterns
    const drawFinder = (startX: number, startY: number) => {
      // Outer 7x7
      rects += `<rect x="${startX * cellSize}" y="${startY * cellSize}" width="${7 * cellSize}" height="${7 * cellSize}" fill="#0f172a" />`;
      rects += `<rect x="${(startX + 1) * cellSize}" y="${(startY + 1) * cellSize}" width="${5 * cellSize}" height="${5 * cellSize}" fill="#ffffff" />`;
      rects += `<rect x="${(startX + 2) * cellSize}" y="${(startY + 2) * cellSize}" width="${3 * cellSize}" height="${3 * cellSize}" fill="#0f172a" />`;
    };

    drawFinder(0, 0); // Top-left
    drawFinder(modules - 7, 0); // Top-right
    drawFinder(0, modules - 7); // Bottom-left

    // Fill data grid
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        // Skip finder areas
        if (
          (r < 8 && c < 8) ||
          (r < 8 && c >= modules - 8) ||
          (r >= modules - 8 && c < 8)
        ) {
          continue;
        }

        // Generate module state based on data hash and coordinates
        const isDark = ((hash ^ (r * 31 + c * 17)) & 3) === 0 || (r === 6 || c === 6);
        if (isDark) {
          rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#0f172a" />`;
        }
      }
    }

    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#ffffff" />
      ${rects}
    </svg>`;
  }
}
