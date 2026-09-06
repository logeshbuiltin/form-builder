/**
 * Core Domain Model: DataSchema & DataField
 * Drives dynamic variable binding, type validation, and form generation.
 */

export type DataFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'array'
  | 'object'
  | 'enum';

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
}

export interface DataFieldOption {
  label: string;
  value: string | number | boolean;
}

export interface DataField {
  key: string;               // e.g. 'patient.name', 'doctor.registrationNumber'
  label: string;             // Human readable label e.g. 'Patient Full Name'
  type: DataFieldType;
  required: boolean;
  defaultValue?: unknown;
  description?: string;
  placeholder?: string;
  options?: DataFieldOption[];
  validationRules?: ValidationRule[];
  itemFields?: DataField[];  // Nested schema for arrays or nested objects
  metadata?: Record<string, unknown>; // e.g. FHIR mapping, clinical code
}

export interface DataSchema {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  version: number;
  fields: DataField[];
  jsonSchema?: Record<string, unknown>; // Standard JSON Schema representation
  sampleData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
