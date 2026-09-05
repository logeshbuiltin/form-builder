import { Injectable } from '@angular/core';

/**
 * Small, deliberately limited template renderer. It supports dotted lookups
 * (`{{patient.name}}`) and nested repeaters (`{{#each items}}...{{/each}}`).
 * Values are HTML-escaped so sample-data preview cannot inject markup.
 */
@Injectable({ providedIn: 'root' })
export class TemplateRendererService {
  render(template: string, data: Record<string, unknown>): string {
    return this.renderSection(template || '', data, data);
  }

  private renderSection(template: string, root: Record<string, unknown>, context: unknown): string {
    const repeatPattern = /{{#each\s+([\w.@-]+)}}([\s\S]*?){{\/each}}/g;
    const withRepeaters = template.replace(repeatPattern, (_match, path, body) => {
      const values = this.lookup(path, root, context);
      if (!Array.isArray(values)) return '';
      return values.map((item, index) => this.renderSection(body, root, { ...this.asObject(item), '@index': index + 1 })).join('');
    });
    return withRepeaters.replace(/{{\s*([\w.@-]+)\s*}}/g, (_match, path) => {
      const value = this.lookup(path, root, context);
      return value === null || value === undefined ? '' : this.escape(String(value));
    });
  }

  private lookup(path: string, root: Record<string, unknown>, context: unknown): unknown {
    if (path === 'this') return context;
    const normalized = path.replace(/^this\./, '');
    const firstSegment = normalized.split('.')[0];
    const contextObject = context && typeof context === 'object' ? context as Record<string, unknown> : {};
    // Within an each block, {{name}} means the current row; parent values still
    // resolve from root when the row does not provide that key.
    const source = path.startsWith('this.') || path === '@index' || Object.prototype.hasOwnProperty.call(contextObject, firstSegment)
      ? context
      : root;
    return normalized.split('.').reduce((value: any, key) => value == null ? undefined : value[key], source as any);
  }

  private asObject(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? value as Record<string, unknown> : { this: value };
  }

  private escape(value: string): string {
    return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] as string));
  }
}
