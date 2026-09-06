import { Injectable } from '@angular/core';
import { DataBindingEngine, BindingOptions } from '../../core/engine/data-binding-engine';

/**
 * Robust Data-Binding & Template Renderer Service.
 * Safely evaluates Handlebars-like templates against structured JSON data.
 * Supports dotted lookups, nested repeats ({{#each}}), conditionals ({{#if}} / {{#unless}}),
 * formatters (date, currency, number), fallbacks, and HTML escaping.
 * Avoids eval() to ensure security and prevent arbitrary code execution.
 */
@Injectable({ providedIn: 'root' })
export class TemplateRendererService {
  /**
   * Renders a template string against structured JSON data.
   * @param template Template HTML or text with {{variable}} placeholders.
   * @param data Structured data payload (e.g. { patient: {...}, doctor: {...} }).
   * @param options Optional locale, currency, and formatting configurations.
   */
  render(
    template: string,
    data: Record<string, unknown>,
    options?: BindingOptions
  ): string {
    return DataBindingEngine.render(template || '', data || {}, options);
  }
}
