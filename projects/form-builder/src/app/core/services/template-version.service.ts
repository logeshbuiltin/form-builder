import { Injectable, Optional } from '@angular/core';
import { TemplateStoreService } from '../../data/service/template-store.service';
import { TemplateDefinition } from '../../data/model/template.model';
import { TemplateVersion, TemplateStatus, VersionDiffResult } from '../domain/template.model';
import { RbacService } from './rbac.service';
import { TenantWorkspaceService } from './tenant-workspace.service';
import { ClinicalWorkflowService } from '../../data/service/clinical-workflow.service';
import { AuditLogService } from './audit-log.service';
import { AuditAction } from '../domain/audit-event.model';

@Injectable({
  providedIn: 'root',
})
export class TemplateVersionService {
  constructor(
    private templateStore: TemplateStoreService,
    private rbacService: RbacService,
    @Optional() private tenantWorkspaceService?: TenantWorkspaceService,
    @Optional() private clinicalWorkflowService?: ClinicalWorkflowService,
    @Optional() private auditLogService?: AuditLogService
  ) {}

  /**
   * Retrieves all historical and current versions for a specific template.
   */
  getVersions(templateId: string): TemplateVersion[] {
    const template = this.templateStore.getById(templateId);
    if (!template) return [];

    if (!template.versions || template.versions.length === 0) {
      // Trigger store list to ensure auto-migration
      this.templateStore.list();
      const reloaded = this.templateStore.getById(templateId);
      return reloaded?.versions ? [...reloaded.versions].sort((a, b) => b.versionNumber - a.versionNumber) : [];
    }

    return [...template.versions].sort((a, b) => b.versionNumber - a.versionNumber);
  }

  /**
   * Retrieves a specific version of a template by version number.
   */
  getVersion(templateId: string, versionNumber: number): TemplateVersion | undefined {
    const versions = this.getVersions(templateId);
    return versions.find((v) => v.versionNumber === versionNumber);
  }

  /**
   * Creates a new draft version by snapshotting from the current version or specified version.
   */
  createDraftVersion(
    templateId: string,
    changeLog?: string,
    fromVersionNumber?: number
  ): TemplateVersion {
    if (!this.rbacService.hasPermission('template:create') && !this.rbacService.hasPermission('template:edit')) {
      throw new Error('Access Denied: Missing required permission template:edit');
    }

    const template = this.templateStore.getById(templateId);
    if (!template) {
      throw new Error(`Template not found with ID: ${templateId}`);
    }

    const versions = this.getVersions(templateId);
    const sourceVersion = fromVersionNumber
      ? versions.find((v) => v.versionNumber === fromVersionNumber)
      : versions[0] || null;

    const highestVersionNum = versions.length > 0
      ? Math.max(...versions.map((v) => v.versionNumber))
      : template.version || 1;

    const newVersionNumber = highestVersionNum + 1;
    const now = new Date().toISOString();
    const currentUser = this.rbacService.getCurrentUser();
    const author = currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : 'System';

    const newVersion: TemplateVersion = {
      id: `ver_${templateId}_v${newVersionNumber}`,
      templateId,
      versionNumber: newVersionNumber,
      status: 'draft',
      html: sourceVersion ? sourceVersion.html : template.html,
      css: sourceVersion ? sourceVersion.css : template.css,
      design: sourceVersion ? sourceVersion.design : template.design,
      schema: sourceVersion ? sourceVersion.schema : (template.dataSchema as any),
      sampleData: sourceVersion ? sourceVersion.sampleData : template.sampleData,
      changeLog: changeLog || `Draft created from version ${sourceVersion ? sourceVersion.versionNumber : 'current'}`,
      createdBy: author,
      createdAt: now,
    };

    if (!template.versions) template.versions = [];
    template.versions.push(newVersion);
    template.version = newVersionNumber;
    template.status = 'draft';
    template.currentVersionId = newVersion.id;
    template.html = newVersion.html;
    template.css = newVersion.css;
    template.design = newVersion.design;
    template.changeLog = newVersion.changeLog;

    this.templateStore.save(template);
    this.logAuditEvent(templateId, `Created Draft v${newVersionNumber}`, 'draft');

    return newVersion;
  }

  /**
   * Submits a draft version for clinical & administrative review.
   */
  submitForReview(
    templateId: string,
    versionNumber: number,
    reviewNotes?: string
  ): TemplateVersion {
    if (!this.rbacService.hasPermission('template:edit')) {
      throw new Error('Access Denied: Missing required permission template:edit');
    }

    const template = this.templateStore.getById(templateId);
    if (!template) throw new Error(`Template not found with ID: ${templateId}`);

    const version = (template.versions || []).find((v) => v.versionNumber === versionNumber);
    if (!version) throw new Error(`Version v${versionNumber} not found for template ${templateId}`);

    if (version.status !== 'draft') {
      throw new Error(`Only draft versions can be submitted for review. Current status: ${version.status}`);
    }

    const now = new Date().toISOString();
    version.status = 'review';
    version.reviewNotes = reviewNotes || 'Submitted for clinical and legal compliance review';
    version.reviewedAt = now;

    if (template.version === versionNumber) {
      template.status = 'review';
    }

    this.templateStore.save(template);
    this.logAuditEvent(templateId, `Submitted v${versionNumber} for review`, 'review');

    return version;
  }

  /**
   * Approves and publishes a template version.
   * Gated strictly by `template:publish` permission.
   */
  approveAndPublish(
    templateId: string,
    versionNumber: number,
    publishNotes?: string
  ): TemplateVersion {
    if (!this.rbacService.hasPermission('template:publish')) {
      throw new Error('Access Denied: Missing required permission template:publish');
    }

    const template = this.templateStore.getById(templateId);
    if (!template) throw new Error(`Template not found with ID: ${templateId}`);

    const version = (template.versions || []).find((v) => v.versionNumber === versionNumber);
    if (!version) throw new Error(`Version v${versionNumber} not found for template ${templateId}`);

    const now = new Date().toISOString();
    const currentUser = this.rbacService.getCurrentUser();
    const publisher = currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : 'Authorized Administrator';

    // Mark previous published versions as superseded
    (template.versions || []).forEach((v) => {
      if (v.versionNumber !== versionNumber && v.status === 'published') {
        v.status = 'archived';
        v.archivedAt = now;
        v.archivedBy = publisher;
      }
    });

    version.status = 'published';
    version.publishedAt = now;
    version.publishedBy = publisher;
    if (publishNotes) {
      version.changeLog = `${version.changeLog || ''} [Published: ${publishNotes}]`.trim();
    }

    template.version = versionNumber;
    template.status = 'published';
    template.publishedAt = now;
    template.currentVersionId = version.id;
    template.html = version.html;
    template.css = version.css;
    template.design = version.design;
    template.dataSchema = version.schema as any;
    template.sampleData = version.sampleData;

    this.templateStore.save(template);
    this.logAuditEvent(templateId, `Approved & Published v${versionNumber}`, 'published');

    return version;
  }

  /**
   * Rejects a template review and returns it to draft with feedback.
   */
  rejectReview(
    templateId: string,
    versionNumber: number,
    rejectionReason: string
  ): TemplateVersion {
    if (!this.rbacService.hasPermission('template:edit') && !this.rbacService.hasPermission('template:publish')) {
      throw new Error('Access Denied: Missing required permission template:edit');
    }

    const template = this.templateStore.getById(templateId);
    if (!template) throw new Error(`Template not found with ID: ${templateId}`);

    const version = (template.versions || []).find((v) => v.versionNumber === versionNumber);
    if (!version) throw new Error(`Version v${versionNumber} not found for template ${templateId}`);

    version.status = 'draft';
    version.reviewNotes = `Review Rejected: ${rejectionReason}`;

    if (template.version === versionNumber) {
      template.status = 'draft';
    }

    this.templateStore.save(template);
    this.logAuditEvent(templateId, `Review Rejected for v${versionNumber}: ${rejectionReason}`, 'draft');

    return version;
  }

  /**
   * Rolls back template content to a historical version.
   */
  rollbackToVersion(templateId: string, versionNumber: number): TemplateVersion {
    if (!this.rbacService.hasPermission('template:edit')) {
      throw new Error('Access Denied: Missing required permission template:edit');
    }

    const template = this.templateStore.getById(templateId);
    if (!template) throw new Error(`Template not found with ID: ${templateId}`);

    const targetVersion = (template.versions || []).find((v) => v.versionNumber === versionNumber);
    if (!targetVersion) throw new Error(`Target version v${versionNumber} not found`);

    template.version = targetVersion.versionNumber;
    template.status = targetVersion.status;
    template.currentVersionId = targetVersion.id;
    template.html = targetVersion.html;
    template.css = targetVersion.css;
    template.design = targetVersion.design;
    template.dataSchema = targetVersion.schema as any;
    template.sampleData = targetVersion.sampleData;

    this.templateStore.save(template);
    this.logAuditEvent(templateId, `Rolled back to v${versionNumber}`, targetVersion.status);

    return targetVersion;
  }

  /**
   * Archives a specific version of a template.
   */
  archiveVersion(templateId: string, versionNumber: number): TemplateVersion {
    if (!this.rbacService.hasPermission('template:delete') && !this.rbacService.hasPermission('template:edit')) {
      throw new Error('Access Denied: Missing required permission template:delete');
    }

    const template = this.templateStore.getById(templateId);
    if (!template) throw new Error(`Template not found with ID: ${templateId}`);

    const version = (template.versions || []).find((v) => v.versionNumber === versionNumber);
    if (!version) throw new Error(`Version v${versionNumber} not found`);

    const now = new Date().toISOString();
    const currentUser = this.rbacService.getCurrentUser();
    version.status = 'archived';
    version.archivedAt = now;
    version.archivedBy = currentUser ? currentUser.email : 'System';

    // If active version was archived, check if all versions are archived
    const allArchived = (template.versions || []).every((v) => v.status === 'archived');
    if (allArchived || template.version === versionNumber) {
      template.status = 'archived';
    }

    this.templateStore.save(template);
    this.logAuditEvent(templateId, `Archived v${versionNumber}`, 'archived');

    return version;
  }

  /**
   * Archives an entire template and all its associated versions.
   */
  archiveTemplate(templateId: string): TemplateDefinition {
    if (!this.rbacService.hasPermission('template:delete')) {
      throw new Error('Access Denied: Missing required permission template:delete');
    }

    const template = this.templateStore.getById(templateId);
    if (!template) throw new Error(`Template not found with ID: ${templateId}`);

    const now = new Date().toISOString();
    const currentUser = this.rbacService.getCurrentUser();
    const author = currentUser ? currentUser.email : 'System';

    template.status = 'archived';
    (template.versions || []).forEach((v) => {
      v.status = 'archived';
      v.archivedAt = now;
      v.archivedBy = author;
    });

    this.templateStore.save(template);
    this.logAuditEvent(templateId, `Archived template ${template.name}`, 'archived');

    return template;
  }

  /**
   * Compares two versions and returns a structured diff summary.
   */
  compareVersions(templateId: string, vANumber: number, vBNumber: number): VersionDiffResult {
    const vA = this.getVersion(templateId, vANumber);
    const vB = this.getVersion(templateId, vBNumber);

    if (!vA || !vB) {
      throw new Error(`Cannot compare: one or both versions (v${vANumber}, v${vBNumber}) do not exist`);
    }

    // HTML Diff calculation
    const linesA = (vA.html || '').split('\n').map((l) => l.trim()).filter(Boolean);
    const linesB = (vB.html || '').split('\n').map((l) => l.trim()).filter(Boolean);
    const addedLines = linesB.filter((line) => !linesA.includes(line));
    const removedLines = linesA.filter((line) => !linesB.includes(line));
    const htmlChanged = vA.html !== vB.html;

    let htmlSummary = 'No visual HTML markup changes detected.';
    if (htmlChanged) {
      htmlSummary = `HTML modified: +${addedLines.length} lines added, -${removedLines.length} lines removed.`;
    }

    // CSS Diff calculation
    const cssChanged = (vA.css || '').trim() !== (vB.css || '').trim();
    const cssSummary = cssChanged ? 'CSS styling has been modified.' : 'No CSS changes detected.';

    // Schema Diff calculation
    const schemaKeysA = Object.keys(vA.schema || {});
    const schemaKeysB = Object.keys(vB.schema || {});
    const addedFields = schemaKeysB.filter((k) => !schemaKeysA.includes(k));
    const removedFields = schemaKeysA.filter((k) => !schemaKeysB.includes(k));
    const schemaChanged = addedFields.length > 0 || removedFields.length > 0 || JSON.stringify(vA.schema) !== JSON.stringify(vB.schema);

    return {
      templateId,
      versionA: vANumber,
      versionB: vBNumber,
      statusA: vA.status,
      statusB: vB.status,
      htmlDiff: {
        addedLinesCount: addedLines.length,
        removedLinesCount: removedLines.length,
        hasChanges: htmlChanged,
        summary: htmlSummary,
      },
      cssDiff: {
        hasChanges: cssChanged,
        summary: cssSummary,
      },
      schemaDiff: {
        addedFields,
        removedFields,
        hasChanges: schemaChanged,
      },
      authorDiff: {
        authorA: vA.createdBy,
        authorB: vB.createdBy,
        dateA: vA.createdAt,
        dateB: vB.createdAt,
      },
      changeLogB: vB.changeLog,
    };
  }

  private logAuditEvent(templateId: string, action: string, status: TemplateStatus): void {
    if (this.auditLogService) {
      try {
        let auditAction: AuditAction = 'template.edited';
        if (action.includes('Created Draft')) auditAction = 'template_version.created';
        else if (action.includes('Published')) auditAction = 'template.published';
        else if (action.includes('Archived')) auditAction = 'template.archived';
        else if (action.includes('Rolled back')) auditAction = 'template_version.rollback';

        this.auditLogService.recordEvent(
          auditAction,
          'template',
          templateId,
          {
            governanceAction: action,
            status,
          }
        );
      } catch {
        // Safe fallback
      }
    }

    if (this.clinicalWorkflowService) {
      try {
        const currentUser = this.rbacService.getCurrentUser();
        const userName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : 'System';
        this.clinicalWorkflowService.record(
          'reviewed',
          userName,
          `[Template Governance] ${action} (${status}) for template ${templateId}`
        );
      } catch {
        // Safe fallback
      }
    }
  }
}
