import { Injectable } from '@angular/core';
import { TemplateDefinition } from '../model/template.model';

@Injectable({ providedIn: 'root' })
export class TemplateStoreService {
  private readonly storageKey = 'form_builder_generic_templates_v1';

  list(): TemplateDefinition[] {
    try {
      const items = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  }

  save(template: TemplateDefinition): TemplateDefinition {
    const templates = this.list();
    const index = templates.findIndex(item => item.id === template.id);
    if (index >= 0) templates[index] = template;
    else templates.unshift(template);
    localStorage.setItem(this.storageKey, JSON.stringify(templates));
    return template;
  }

  duplicate(template: TemplateDefinition): TemplateDefinition {
    const now = new Date().toISOString();
    const copy: TemplateDefinition = {
      ...template,
      id: this.newId(),
      name: `${template.name} (copy)`,
      status: 'draft',
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    return this.save(copy);
  }

  newId(): string {
    return `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}
