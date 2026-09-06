import { Injectable } from '@angular/core';
import { DocumentFormat } from '../../data/model/document-formats.model';
import {
  AIExtractedAttributes,
  AISearchMatchAttributes,
  AISearchResponse,
  AISearchResult,
} from '../domain/ai-request.model';

@Injectable({
  providedIn: 'root',
})
export class AITemplateSearchService {
  private readonly stopWords = new Set([
    'i', 'need', 'a', 'an', 'the', 'for', 'in', 'of', 'to', 'and', 'with', 'on', 'at', 'from', 'by', 'form', 'forms', 'document', 'template', 'templates', 'please', 'find', 'show', 'create', 'me',
    'ich', 'brauche', 'ein', 'eine', 'einen', 'einer', 'eines', 'für', 'in', 'und', 'mit', 'von', 'zu', 'auf', 'aus', 'formular', 'vorlage', 'dokument', 'bitte', 'suche', 'zeige', 'mir',
  ]);

  /**
   * Parses natural language queries into structured template attributes.
   * Supports bilingual queries (English & German) across healthcare and administrative domains.
   */
  public extractAttributes(query: string): AIExtractedAttributes {
    if (!query || !query.trim()) {
      return {};
    }

    const q = query.toLowerCase().trim();
    const attributes: AIExtractedAttributes = {};

    // 1. Industry Identification
    if (this.matchesAny(q, ['physiotherapy', 'physio', 'physiotherapie', 'krankengymnastik', 'physical therapy', 'rehab', 'rehabilitation'])) {
      attributes.industry = 'Physiotherapy';
    } else if (this.matchesAny(q, ['dental', 'dentist', 'dentistry', 'zahnarzt', 'zahnmedizin', 'zahnärztlich', 'odontogram', 'oral'])) {
      attributes.industry = 'Dental';
    } else if (this.matchesAny(q, ['laboratory', 'lab', 'pathology', 'labor', 'laborbericht', 'pathologie', 'blood test', 'blutbild', 'specimen'])) {
      attributes.industry = 'Laboratory';
    } else if (this.matchesAny(q, ['administrative', 'admin', 'billing', 'invoice', 'receipt', 'rechnung', 'quittung', 'buchhaltung', 'finance'])) {
      attributes.industry = 'Administrative';
    } else if (this.matchesAny(q, ['clinical', 'medical', 'hospital', 'doctor', 'physician', 'klinik', 'arzt', 'ärztlich', 'krankenhaus', 'ambulant', 'inpatient'])) {
      attributes.industry = 'Healthcare';
    }

    // 2. Document Type Identification
    if (this.matchesAny(q, ['initial assessment', 'assessment', 'erstbefund', 'befundaufnahme', 'aufnahmebefund', 'statuserhebung'])) {
      attributes.documentType = 'Initial assessment';
    } else if (this.matchesAny(q, ['consent', 'informed consent', 'einwilligung', 'einwilligungserklärung', 'einverständnis'])) {
      attributes.documentType = 'Consent form';
    } else if (this.matchesAny(q, ['registration', 'intake', 'onboarding', 'anmeldung', 'aufnahme', 'patientenaufnahme', 'stammdaten'])) {
      attributes.documentType = 'Patient registration';
    } else if (this.matchesAny(q, ['discharge', 'discharge summary', 'entlassung', 'entlassungsbericht', 'entlassbrief', 'austritt'])) {
      attributes.documentType = 'Discharge summary';
    } else if (this.matchesAny(q, ['referral', 'referral letter', 'überweisung', 'überweisungsschein', 'konsil', 'einweisung'])) {
      attributes.documentType = 'Referral letter';
    } else if (this.matchesAny(q, ['consultation', 'consultation report', 'arztbericht', 'konsultation', 'sprechstunde', 'visite'])) {
      attributes.documentType = 'Consultation report';
    } else if (this.matchesAny(q, ['examination', 'dental exam', 'untersuchung', 'zahnuntersuchung', 'status'])) {
      attributes.documentType = 'Examination report';
    } else if (this.matchesAny(q, ['invoice', 'bill', 'rechnung', 'arztrechnung', 'honorar', 'liquidation'])) {
      attributes.documentType = 'Invoice';
    } else if (this.matchesAny(q, ['receipt', 'quittung', 'zahlungsbeleg', 'kassenbeleg', 'beleg'])) {
      attributes.documentType = 'Receipt';
    } else if (this.matchesAny(q, ['quotation', 'estimate', 'angebot', 'kostenvoranschlag', 'kostenplan', 'heil- und kostenplan'])) {
      attributes.documentType = 'Quotation';
    } else if (this.matchesAny(q, ['treatment plan', 'behandlungsplan', 'therapieplan', 'rehab plan'])) {
      attributes.documentType = 'Treatment plan';
    } else if (this.matchesAny(q, ['lab report', 'laboratory report', 'laborbericht', 'befund'])) {
      attributes.documentType = 'Laboratory report';
    } else if (this.matchesAny(q, ['questionnaire', 'survey', 'screening', 'fragebogen', 'anamnesebogen'])) {
      attributes.documentType = 'Questionnaire';
    }

    // 3. Country Identification
    if (this.matchesAny(q, ['germany', 'deutschland', 'german', 'de'])) {
      attributes.country = 'Germany';
    } else if (this.matchesAny(q, ['united states', 'usa', 'us', 'america', 'american'])) {
      attributes.country = 'United States';
    } else if (this.matchesAny(q, ['united kingdom', 'uk', 'britain', 'british', 'england'])) {
      attributes.country = 'United Kingdom';
    } else if (this.matchesAny(q, ['switzerland', 'schweiz', 'swiss'])) {
      attributes.country = 'Switzerland';
    } else if (this.matchesAny(q, ['austria', 'österreich', 'austrian'])) {
      attributes.country = 'Austria';
    }

    // 4. Language Identification
    if (this.matchesAny(q, ['german', 'deutsch', 'auf deutsch', 'deutscher', 'deutsche', 'deutsches'])) {
      attributes.language = 'German';
    } else if (this.matchesAny(q, ['english', 'englisch', 'in english', 'englischer', 'englische'])) {
      attributes.language = 'English';
    }

    // 5. Audience Identification
    if (this.matchesAny(q, ['adult', 'adults', 'erwachsene', 'erwachsener', 'erwachsenen'])) {
      attributes.audience = 'Adult';
    } else if (this.matchesAny(q, ['pediatric', 'pediatrics', 'child', 'children', 'infant', 'pädiatrie', 'pädiatrisch', 'kinder', 'kind'])) {
      attributes.audience = 'Pediatric';
    } else if (this.matchesAny(q, ['geriatric', 'elderly', 'senior', 'seniors', 'geriatrie', 'geriatrisch', 'senioren', 'ältere'])) {
      attributes.audience = 'Geriatric';
    } else if (this.matchesAny(q, ['inpatient', 'stationär', 'stationäre'])) {
      attributes.audience = 'Inpatient';
    } else if (this.matchesAny(q, ['outpatient', 'ambulant', 'ambulante'])) {
      attributes.audience = 'Outpatient';
    }

    // 6. Tokenized Keywords (excluding stop words)
    const rawTokens = q
      .replace(/[^\w\säöüß-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !this.stopWords.has(t));
    attributes.keywords = Array.from(new Set(rawTokens));

    return attributes;
  }

  /**
   * Searches, ranks, and returns recommended templates based on structured attribute extraction
   * and semantic relevance scoring.
   */
  public search(query: string, templates: DocumentFormat[]): AISearchResponse {
    const extracted = this.extractAttributes(query);
    const results: AISearchResult[] = [];

    const hasStructuredAttributes = !!(
      extracted.industry ||
      extracted.documentType ||
      extracted.language ||
      extracted.country ||
      extracted.audience
    );

    for (const tmpl of templates) {
      const matchDetails = this.evaluateTemplateMatch(tmpl, extracted, query);
      if (matchDetails.score > 15) {
        results.push({
          template: tmpl,
          score: Math.min(100, Math.round(matchDetails.score)),
          matchReason: matchDetails.reason,
          matchedAttributes: matchDetails.matchedAttributes,
        });
      }
    }

    // Sort descending by score
    results.sort((a, b) => b.score - a.score);

    return {
      query,
      extractedAttributes: extracted,
      results,
      searchMode: hasStructuredAttributes ? 'deterministic_metadata' : 'semantic_interpretation',
      totalFound: results.length,
    };
  }

  private evaluateTemplateMatch(
    tmpl: DocumentFormat,
    extracted: AIExtractedAttributes,
    rawQuery: string
  ): { score: number; reason: string; matchedAttributes: AISearchMatchAttributes } {
    let score = 0;
    const reasons: string[] = [];
    const matchedAttributes: AISearchMatchAttributes = {};

    const tmplId = (tmpl.id || '').toLowerCase();
    const tmplName = (tmpl.name || '').toLowerCase();
    const tmplDesc = (tmpl.description || '').toLowerCase();
    const tmplCat = (tmpl.category || '').toLowerCase();
    const tmplIndustry = (tmpl.industry || tmplCat).toLowerCase();
    const tmplDocType = (tmpl.documentTypeId || tmplId).toLowerCase();

    // 1. Document Type Match (highest weight: 35 pts)
    if (extracted.documentType) {
      const docTypeKey = extracted.documentType.toLowerCase().replace(/\s+/g, '_');
      if (tmplDocType.includes(docTypeKey) || tmplId.includes(docTypeKey)) {
        score += 35;
        matchedAttributes.documentType = extracted.documentType;
        reasons.push(`matches ${extracted.documentType} document type`);
      } else if (tmplName.includes(extracted.documentType.toLowerCase()) || tmplDesc.includes(extracted.documentType.toLowerCase())) {
        score += 25;
        matchedAttributes.documentType = extracted.documentType;
        reasons.push(`closely aligns with ${extracted.documentType}`);
      }
    }

    // 2. Industry Match (weight: 25 pts)
    if (extracted.industry) {
      const targetIndustry = extracted.industry.toLowerCase();
      if (
        tmplIndustry.includes(targetIndustry) ||
        tmplCat.includes(targetIndustry) ||
        (targetIndustry === 'healthcare' && (tmplCat === 'clinical_documents' || tmplCat === 'patient_forms'))
      ) {
        score += 25;
        matchedAttributes.industry = extracted.industry;
        reasons.push(`belongs to ${extracted.industry} industry`);
      }
    }

    // 3. Country / Region Match (weight: 15 pts)
    if (extracted.country) {
      matchedAttributes.country = extracted.country;
      score += 15;
      reasons.push(`tailored for ${extracted.country}`);
    }

    // 4. Language Match (weight: 15 pts)
    if (extracted.language) {
      matchedAttributes.language = extracted.language;
      score += 15;
      reasons.push(`configured for ${extracted.language}`);
    }

    // 5. Audience Match (weight: 10 pts)
    if (extracted.audience) {
      const audienceKey = extracted.audience.toLowerCase();
      if (tmplDesc.includes(audienceKey) || tmplName.includes(audienceKey) || (tmpl.features && tmpl.features.some((f) => f.toLowerCase().includes(audienceKey)))) {
        score += 10;
        matchedAttributes.audience = extracted.audience;
        reasons.push(`designed for ${extracted.audience} population`);
      } else {
        // Audience is compatible with general clinical templates
        score += 5;
        matchedAttributes.audience = extracted.audience;
      }
    }

    // 6. Keywords Match (up to 15 pts)
    const matchedKeywords: string[] = [];
    if (extracted.keywords && extracted.keywords.length > 0) {
      for (const kw of extracted.keywords) {
        if (
          tmplName.includes(kw) ||
          tmplDesc.includes(kw) ||
          (tmpl.features && tmpl.features.some((f) => f.toLowerCase().includes(kw))) ||
          (tmpl.tokens && tmpl.tokens.some((t) => t.key.toLowerCase().includes(kw) || t.label.toLowerCase().includes(kw)))
        ) {
          matchedKeywords.push(kw);
          score += 5;
        }
      }
      if (matchedKeywords.length > 0) {
        matchedAttributes.keywords = matchedKeywords;
      }
    }

    // Direct token / raw query match bonus
    const cleanRaw = rawQuery.toLowerCase();
    if (tmplName.includes(cleanRaw) || cleanRaw.includes(tmplId.replace(/_/g, ' '))) {
      score += 20;
    }

    // Compose human-readable match reason
    let reason = 'Relevant document template.';
    if (reasons.length > 0) {
      reason = 'Recommended: ' + reasons.join(', ') + '.';
    } else if (matchedKeywords.length > 0) {
      reason = `Matches search keywords: ${matchedKeywords.join(', ')}.`;
    }

    return { score, reason, matchedAttributes };
  }

  private matchesAny(text: string, patterns: string[]): boolean {
    return patterns.some((p) => {
      // Word boundary match or inclusion
      const regex = new RegExp(`(^|\\b|\\s)${p}(\\b|\\s|$)`, 'i');
      return regex.test(text) || text.includes(p);
    });
  }
}
