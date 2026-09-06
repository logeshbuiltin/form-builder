import { Injectable } from '@angular/core';
import { TemplateDefinition } from '../model/template.model';
import { TemplateVersion } from '../../core/domain/template.model';

@Injectable({ providedIn: 'root' })
export class TemplateStoreService {
  private readonly storageKey = 'form_builder_generic_templates_v1';

  list(): TemplateDefinition[] {
    try {
      const items = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      if (!Array.isArray(items)) return [];

      // Auto-migrate legacy templates to include versions array
      let modified = false;
      const normalized = items.map((template: TemplateDefinition) => {
        if (!template.versions || template.versions.length === 0) {
          const v1: TemplateVersion = {
            id: `ver_${template.id}_v${template.version || 1}`,
            templateId: template.id,
            versionNumber: template.version || 1,
            status: template.status || 'published',
            html: template.html || '',
            css: template.css || '',
            design: template.design || null,
            schema: template.dataSchema as any,
            sampleData: template.sampleData,
            changeLog: template.changeLog || 'Initial version release',
            createdBy: template.ownerId || 'system',
            createdAt: template.createdAt || new Date().toISOString(),
            publishedAt: template.status === 'published' ? (template.publishedAt || template.createdAt || new Date().toISOString()) : undefined,
          };
          template.versions = [v1];
          template.currentVersionId = v1.id;
          modified = true;
        }
        return template;
      });

      if (modified) {
        localStorage.setItem(this.storageKey, JSON.stringify(normalized));
      }

      return normalized;
    } catch {
      return [];
    }
  }

  getById(id: string): TemplateDefinition | undefined {
    return this.list().find((item) => item.id === id);
  }

  save(template: TemplateDefinition): TemplateDefinition {
    const templates = this.list();
    const index = templates.findIndex((item) => item.id === template.id);

    const now = new Date().toISOString();
    if (!template.createdAt) template.createdAt = now;
    template.updatedAt = now;

    // Maintain versions array
    if (!template.versions) {
      template.versions = [];
    }

    const currentVersionNum = template.version || 1;
    const existingVerIndex = template.versions.findIndex(
      (v) => v.versionNumber === currentVersionNum
    );

    const versionSnapshot: TemplateVersion = {
      id: existingVerIndex >= 0 ? template.versions[existingVerIndex].id : `ver_${template.id}_v${currentVersionNum}`,
      templateId: template.id,
      versionNumber: currentVersionNum,
      status: template.status || 'draft',
      html: template.html || '',
      css: template.css || '',
      design: template.design || null,
      schema: template.dataSchema as any,
      sampleData: template.sampleData,
      changeLog: template.changeLog || (existingVerIndex >= 0 ? template.versions[existingVerIndex].changeLog : `Update version v${currentVersionNum}`),
      createdBy: template.ownerId || 'system',
      createdAt: existingVerIndex >= 0 ? template.versions[existingVerIndex].createdAt : now,
      publishedAt: template.status === 'published' ? (template.publishedAt || now) : undefined,
    };

    if (existingVerIndex >= 0) {
      template.versions[existingVerIndex] = {
        ...template.versions[existingVerIndex],
        ...versionSnapshot,
      };
    } else {
      template.versions.push(versionSnapshot);
    }

    template.currentVersionId = versionSnapshot.id;

    if (index >= 0) templates[index] = template;
    else templates.unshift(template);

    localStorage.setItem(this.storageKey, JSON.stringify(templates));
    return template;
  }

  duplicate(template: TemplateDefinition): TemplateDefinition {
    const now = new Date().toISOString();
    const newId = this.newId();
    const v1: TemplateVersion = {
      id: `ver_${newId}_v1`,
      templateId: newId,
      versionNumber: 1,
      status: 'draft',
      html: template.html || '',
      css: template.css || '',
      design: template.design || null,
      schema: template.dataSchema as any,
      sampleData: template.sampleData,
      changeLog: `Duplicated from ${template.name}`,
      createdBy: template.ownerId || 'system',
      createdAt: now,
    };

    const copy: TemplateDefinition = {
      ...template,
      id: newId,
      name: `${template.name} (copy)`,
      status: 'draft',
      version: 1,
      currentVersionId: v1.id,
      versions: [v1],
      changeLog: `Duplicated from ${template.name}`,
      createdAt: now,
      updatedAt: now,
    };
    return this.save(copy);
  }

  delete(id: string): boolean {
    const templates = this.list();
    const filtered = templates.filter((item) => item.id !== id);
    if (filtered.length !== templates.length) {
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
      return true;
    }
    return false;
  }

  newId(): string {
    return `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}
