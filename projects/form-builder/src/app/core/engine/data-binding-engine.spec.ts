import { DataBindingEngine } from './data-binding-engine';

describe('DataBindingEngine (Phase 3)', () => {
  it('should safely interpolate simple and nested dotted fields', () => {
    const template = 'Patient: {{patient.name}}, DOB: {{patient.dateOfBirth}}, City: {{patient.address.city}}';
    const data = {
      patient: {
        name: 'Jane Doe',
        dateOfBirth: '1990-05-15',
        address: {
          city: 'Berlin',
        },
      },
    };

    const result = DataBindingEngine.render(template, data);
    expect(result).toBe('Patient: Jane Doe, DOB: 1990-05-15, City: Berlin');
  });

  it('should support default values when fields are missing or empty', () => {
    const template1 = 'Insurance: {{default patient.insurance "Self Pay"}}';
    const template2 = 'Insurance: {{patient.insurance || "Private Self-Pay"}}';
    const data = { patient: { name: 'John Doe' } };

    expect(DataBindingEngine.render(template1, data)).toBe('Insurance: Self Pay');
    expect(DataBindingEngine.render(template2, data)).toBe('Insurance: Private Self-Pay');
  });

  it('should render conditional blocks ({{#if}} and {{else}})', () => {
    const template = `
      {{#if patient.insurance}}
        Insurance: {{patient.insurance}}
      {{else}}
        No Insurance on File
      {{/if}}
    `.trim();

    const withInsurance = { patient: { insurance: 'TK Health #847291' } };
    const withoutInsurance = { patient: { insurance: null } };

    expect(DataBindingEngine.render(template, withInsurance)).toContain('Insurance: TK Health #847291');
    expect(DataBindingEngine.render(template, withoutInsurance)).toContain('No Insurance on File');
  });

  it('should render comparison conditionals (>=, ==, !=, <)', () => {
    const template = '{{#if patient.age >= 18}}Adult Care{{else}}Pediatric Care{{/if}}';

    expect(DataBindingEngine.render(template, { patient: { age: 24 } })).toBe('Adult Care');
    expect(DataBindingEngine.render(template, { patient: { age: 12 } })).toBe('Pediatric Care');
  });

  it('should render negative conditionals ({{#unless}})', () => {
    const template = '{{#unless patient.allergies}}No Known Drug Allergies (NKDA){{/unless}}';

    expect(DataBindingEngine.render(template, { patient: { allergies: '' } })).toBe('No Known Drug Allergies (NKDA)');
    expect(DataBindingEngine.render(template, { patient: { allergies: 'Penicillin' } })).toBe('');
  });

  it('should render repeating sections ({{#each}}) with loop variables', () => {
    const template = `{{#each medications}}[{{@index}}] {{name}} — {{dosage}}{{#unless @last}}, {{/unless}}{{/each}}`;
    const data = {
      medications: [
        { name: 'Ibuprofen', dosage: '400mg' },
        { name: 'Amoxicillin', dosage: '500mg' },
      ],
    };

    const result = DataBindingEngine.render(template, data);
    expect(result).toBe('[1] Ibuprofen — 400mg, [2] Amoxicillin — 500mg');
  });

  it('should render {{else}} fallback when an each block is empty', () => {
    const template = '{{#each medications}}{{name}}{{else}}No active prescriptions.{{/each}}';
    const data = { medications: [] };

    expect(DataBindingEngine.render(template, data)).toBe('No active prescriptions.');
  });

  it('should format dates, currency, and numbers safely', () => {
    const template = 'DOB: {{date patient.dob "DD.MM.YYYY"}} | Total: {{currency invoice.total "EUR"}} | Value: {{number lab.val 2}}';
    const data = {
      patient: { dob: '1985-04-12' },
      invoice: { total: 1250.5 },
      lab: { val: 4.5678 },
    };

    const result = DataBindingEngine.render(template, data, { locale: 'en-US' });
    expect(result).toContain('DOB: 12.04.1985');
    expect(result).toContain('1,250.50');
    expect(result).toContain('4.57');
  });

  it('should escape HTML in double braces and preserve markup in triple braces', () => {
    const template = 'Escaped: {{malicious}} | Raw: {{{safeHtml}}}';
    const data = {
      malicious: '<script>alert("xss")</script>',
      safeHtml: '<span class="badge">Verified</span>',
    };

    const result = DataBindingEngine.render(template, data);
    expect(result).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(result).not.toContain('<script>');
    expect(result).toContain('<span class="badge">Verified</span>');
  });

  it('should safely handle non-existent variables without throwing errors', () => {
    const template = 'Missing: {{patient.nonExistent.subField}}';
    const data = {};

    expect(() => DataBindingEngine.render(template, data)).not.toThrow();
    expect(DataBindingEngine.render(template, data)).toBe('Missing: ');
  });
});
