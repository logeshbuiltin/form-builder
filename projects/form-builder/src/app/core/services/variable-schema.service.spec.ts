import { TestBed } from '@angular/core/testing';
import { VariableSchemaService, VariableItem } from './variable-schema.service';

describe('VariableSchemaService', () => {
  let service: VariableSchemaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VariableSchemaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return standard scope groups including patient, doctor, clinic, appointment, and billing', () => {
    const groups = service.getScopeGroups();
    const groupIds = groups.map((g) => g.id);
    expect(groupIds).toContain('patient');
    expect(groupIds).toContain('doctor');
    expect(groupIds).toContain('clinic');
    expect(groupIds).toContain('appointment');
    expect(groupIds).toContain('billing');
    expect(groupIds).toContain('document');
  });

  it('should generate standard Handlebars variable syntax {{scope.key}}', () => {
    expect(service.generateVariableSyntax('patient.name')).toBe('{{patient.name}}');
    expect(service.generateVariableSyntax('doctor.registrationNumber')).toBe('{{doctor.registrationNumber}}');
    expect(service.generateVariableSyntax('clinic.name')).toBe('{{clinic.name}}');
  });

  it('should generate conditional Handlebars block {{#if scope.key}}...{{/if}}', () => {
    const conditional = service.generateConditionalSyntax('patient.allergies', 'Known Allergies');
    expect(conditional).toContain('{{#if patient.allergies}}');
    expect(conditional).toContain('{{patient.allergies}}');
    expect(conditional).toContain('{{/if}}');
  });

  it('should generate repeating loop table for array variables', () => {
    const itemVar: VariableItem = {
      key: 'items',
      label: 'Line Items',
      scope: 'billing',
      type: 'array',
      isRepeatable: true,
      childFields: [
        { key: 'name', label: 'Item Name', scope: 'billing', type: 'string' },
        { key: 'amount', label: 'Amount', scope: 'billing', type: 'number' },
      ],
    };
    const repeater = service.generateRepeaterSyntax(itemVar);
    expect(repeater).toContain('{{#each items}}');
    expect(repeater).toContain('{{name}}');
    expect(repeater).toContain('{{amount}}');
    expect(repeater).toContain('{{/each}}');
  });

  it('should register and persist custom variables', () => {
    const custom: VariableItem = {
      key: 'lab.glucoseLevel',
      label: 'Blood Glucose Level',
      scope: 'custom',
      type: 'number',
      sampleValue: '95 mg/dL',
    };
    service.registerCustomVariable(custom);
    const all = service.getAllVariables();
    const found = all.find((v) => v.key === 'lab.glucoseLevel');
    expect(found).toBeDefined();
    expect(found?.label).toBe('Blood Glucose Level');
  });
});
