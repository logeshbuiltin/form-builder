/**
 * Core Data Binding Engine
 * Safe, sandboxed templating engine supporting dotted path resolution,
 * nested repeating blocks, conditionals, formatting helpers, and default values.
 * Strictly avoids eval() / new Function() to prevent code injection.
 */

export interface BindingOptions {
  locale?: string;
  defaultCurrency?: string;
  defaultDateFormat?: string;
  emptyValuePlaceholder?: string;
}

export class DataBindingEngine {
  private static readonly DEFAULT_OPTIONS: Required<BindingOptions> = {
    locale: 'en-US',
    defaultCurrency: 'USD',
    defaultDateFormat: 'YYYY-MM-DD',
    emptyValuePlaceholder: '',
  };

  /**
   * Main render function: binds template string against structured data.
   */
  public static render(
    template: string,
    data: Record<string, unknown>,
    options?: BindingOptions
  ): string {
    if (!template) return '';
    const mergedOpts: Required<BindingOptions> = {
      ...this.DEFAULT_OPTIONS,
      ...(options || {}),
    };

    return this.renderContext(template, data, data, mergedOpts);
  }

  /**
   * Evaluates sections (each, if, unless) and variable placeholders recursively.
   */
  private static renderContext(
    template: string,
    root: Record<string, unknown>,
    context: unknown,
    options: Required<BindingOptions>
  ): string {
    let output = template;

    // 1. Process Repeating Blocks: {{#each path}}...{{else}}...{{/each}}
    output = this.processEachBlocks(output, root, context, options);

    // 2. Process Conditional Blocks: {{#if path}}...{{else}}...{{/if}}
    output = this.processIfBlocks(output, root, context, options);

    // 3. Process Negative Conditionals: {{#unless path}}...{{/unless}}
    output = this.processUnlessBlocks(output, root, context, options);

    // 4. Process Triple-brace Raw HTML: {{{path}}}
    output = output.replace(/{{{([\s\S]+?)}}}/g, (_match, expr) => {
      const val = this.evaluateExpression(expr.trim(), root, context, options);
      return val === null || val === undefined ? '' : String(val);
    });

    // 5. Process Double-brace Interpolated Variables: {{path}}
    output = output.replace(/{{\s*([^#\/{][\s\S]*?)\s*}}/g, (_match, expr) => {
      const val = this.evaluateExpression(expr.trim(), root, context, options);
      return val === null || val === undefined ? options.emptyValuePlaceholder : this.escapeHtml(String(val));
    });

    return output;
  }

  /**
   * Parses and evaluates {{#each path}}...{{else}}...{{/each}}
   */
  private static processEachBlocks(
    template: string,
    root: Record<string, unknown>,
    context: unknown,
    options: Required<BindingOptions>
  ): string {
    // Regex for matching balanced {{#each ...}} ... {{/each}}
    const eachRegex = /{{#each\s+([\w.@-]+)}}([\s\S]*?){{\/each}}/g;

    return template.replace(eachRegex, (_match, path, body) => {
      const rawValue = this.resolvePath(path.trim(), root, context);
      let ifBody = body;
      let elseBody = '';

      const elseSplit = body.split(/{{else}}/);
      if (elseSplit.length > 1) {
        ifBody = elseSplit[0];
        elseBody = elseSplit.slice(1).join('{{else}}');
      }

      if (!Array.isArray(rawValue) || rawValue.length === 0) {
        return elseBody ? this.renderContext(elseBody, root, context, options) : '';
      }

      const total = rawValue.length;
      return rawValue
        .map((item, index) => {
          const itemScope = {
            ...this.toObject(item),
            '@index': index + 1,
            '@index0': index,
            '@first': index === 0,
            '@last': index === total - 1,
            '@total': total,
            this: item,
          };
          return this.renderContext(ifBody, root, itemScope, options);
        })
        .join('');
    });
  }

  /**
   * Parses and evaluates {{#if path}}...{{else}}...{{/if}}
   */
  private static processIfBlocks(
    template: string,
    root: Record<string, unknown>,
    context: unknown,
    options: Required<BindingOptions>
  ): string {
    const ifRegex = /{{#if\s+([^}]+)}}([\s\S]*?){{\/if}}/g;

    return template.replace(ifRegex, (_match, conditionExpr, body) => {
      let ifBody = body;
      let elseBody = '';

      const elseSplit = body.split(/{{else}}/);
      if (elseSplit.length > 1) {
        ifBody = elseSplit[0];
        elseBody = elseSplit.slice(1).join('{{else}}');
      }

      const conditionResult = this.evaluateCondition(conditionExpr.trim(), root, context);

      if (conditionResult) {
        return this.renderContext(ifBody, root, context, options);
      } else {
        return elseBody ? this.renderContext(elseBody, root, context, options) : '';
      }
    });
  }

  /**
   * Parses and evaluates {{#unless path}}...{{/unless}}
   */
  private static processUnlessBlocks(
    template: string,
    root: Record<string, unknown>,
    context: unknown,
    options: Required<BindingOptions>
  ): string {
    const unlessRegex = /{{#unless\s+([^}]+)}}([\s\S]*?){{\/unless}}/g;

    return template.replace(unlessRegex, (_match, conditionExpr, body) => {
      let unlessBody = body;
      let elseBody = '';

      const elseSplit = body.split(/{{else}}/);
      if (elseSplit.length > 1) {
        unlessBody = elseSplit[0];
        elseBody = elseSplit.slice(1).join('{{else}}');
      }

      const conditionResult = this.evaluateCondition(conditionExpr.trim(), root, context);

      if (!conditionResult) {
        return this.renderContext(unlessBody, root, context, options);
      } else {
        return elseBody ? this.renderContext(elseBody, root, context, options) : '';
      }
    });
  }

  /**
   * Evaluates expressions with pipes, formatters, or fallbacks.
   * e.g.:
   *   patient.name
   *   invoice.total || "$0.00"
   *   default patient.allergies "None Reported"
   *   currency invoice.total "EUR"
   *   date patient.dateOfBirth "YYYY-MM-DD"
   *   number item.rate 2
   */
  private static evaluateExpression(
    expr: string,
    root: Record<string, unknown>,
    context: unknown,
    options: Required<BindingOptions>
  ): unknown {
    if (!expr) return '';

    // 1. Check for pipeline syntax: e.g. "path | currency: 'EUR'" or "path | default: 'N/A'"
    if (expr.includes('|') && !expr.includes('||')) {
      const parts = expr.split('|').map((p) => p.trim());
      let value = this.resolvePath(parts[0], root, context);
      for (let i = 1; i < parts.length; i++) {
        value = this.applyFilter(parts[i], value, options);
      }
      return value;
    }

    // 2. Check for fallback || syntax: e.g. `patient.insurance || "Self Pay"`
    if (expr.includes('||')) {
      const parts = expr.split('||').map((p) => p.trim());
      for (const p of parts) {
        if (this.isQuotedLiteral(p)) {
          return this.stripQuotes(p);
        }
        const val = this.resolvePath(p, root, context);
        if (this.isTruthy(val)) {
          return val;
        }
      }
      return '';
    }

    // 3. Check for helper prefix syntax: e.g. `currency invoice.total "EUR"`
    const tokens = this.tokenizeExpression(expr);
    if (tokens.length > 1) {
      const helper = tokens[0].toLowerCase();
      const targetPath = tokens[1];
      const param1 = tokens[2] ? this.stripQuotes(tokens[2]) : undefined;
      const param2 = tokens[3] ? this.stripQuotes(tokens[3]) : undefined;

      const rawVal = this.resolvePath(targetPath, root, context);

      switch (helper) {
        case 'currency':
        case 'formatcurrency':
          return this.formatCurrency(rawVal, param1 || options.defaultCurrency, options.locale);

        case 'date':
        case 'formatdate':
          return this.formatDate(rawVal, param1 || options.defaultDateFormat, options.locale);

        case 'number':
        case 'formatnumber':
          return this.formatNumber(rawVal, param1 ? parseInt(param1, 10) : 2, options.locale);

        case 'default':
          return this.isTruthy(rawVal) ? rawVal : (param1 ?? '');

        case 'uppercase':
        case 'upper':
          return rawVal != null ? String(rawVal).toUpperCase() : '';

        case 'lowercase':
        case 'lower':
          return rawVal != null ? String(rawVal).toLowerCase() : '';
      }
    }

    // 4. Default: Standard path lookup
    return this.resolvePath(expr, root, context);
  }

  /**
   * Applies pipe filters: e.g. `date: 'DD.MM.YYYY'` or `currency: 'EUR'`
   */
  private static applyFilter(
    filterExpr: string,
    value: unknown,
    options: Required<BindingOptions>
  ): unknown {
    const colonIndex = filterExpr.indexOf(':');
    let filterName = filterExpr;
    let filterArg = '';

    if (colonIndex > -1) {
      filterName = filterExpr.substring(0, colonIndex).trim();
      filterArg = this.stripQuotes(filterExpr.substring(colonIndex + 1).trim());
    }

    switch (filterName.toLowerCase()) {
      case 'currency':
        return this.formatCurrency(value, filterArg || options.defaultCurrency, options.locale);

      case 'date':
        return this.formatDate(value, filterArg || options.defaultDateFormat, options.locale);

      case 'number':
        return this.formatNumber(value, filterArg ? parseInt(filterArg, 10) : 2, options.locale);

      case 'default':
        return this.isTruthy(value) ? value : filterArg;

      case 'uppercase':
      case 'upper':
        return value != null ? String(value).toUpperCase() : '';

      case 'lowercase':
      case 'lower':
        return value != null ? String(value).toLowerCase() : '';

      default:
        return value;
    }
  }

  /**
   * Resolves dotted nested path against local context then root data.
   */
  private static resolvePath(
    path: string,
    root: Record<string, unknown>,
    context: unknown
  ): unknown {
    if (!path) return undefined;
    const cleanPath = path.trim();

    if (cleanPath === 'this') return context;
    if (this.isQuotedLiteral(cleanPath)) return this.stripQuotes(cleanPath);
    if (!isNaN(Number(cleanPath)) && cleanPath !== '') return Number(cleanPath);

    // Normalize bracket syntax: items[0].name -> items.0.name
    const normalized = cleanPath.replace(/\[(\w+)\]/g, '.$1').replace(/^this\./, '');
    const segments = normalized.split('.');

    const firstSegment = segments[0];
    const contextObj = context && typeof context === 'object' ? (context as Record<string, unknown>) : {};

    // Check context first (e.g. within an each loop), then root
    let source: any = root;
    if (
      cleanPath.startsWith('this.') ||
      cleanPath.startsWith('@') ||
      Object.prototype.hasOwnProperty.call(contextObj, firstSegment)
    ) {
      source = context;
    }

    let current = source;
    for (const seg of segments) {
      if (current == null) return undefined;
      current = current[seg];
    }
    return current;
  }

  /**
   * Truthiness evaluator for {{#if}} and {{#unless}}.
   */
  private static evaluateCondition(
    condition: string,
    root: Record<string, unknown>,
    context: unknown
  ): boolean {
    const trimmed = condition.trim();

    // Check negation: e.g. `!patient.insurance`
    if (trimmed.startsWith('!')) {
      return !this.evaluateCondition(trimmed.substring(1).trim(), root, context);
    }

    // Comparison operators: ===, !==, ==, !=, >=, <=, >, < (longer operators first)
    const cmpMatch = trimmed.match(/^([\w.@-]+)\s*(===|!==|==|!=|>=|<=|>|<)\s*(.+)$/);
    if (cmpMatch) {
      const left = this.resolvePath(cmpMatch[1], root, context);
      const op = cmpMatch[2];
      const rightValRaw = cmpMatch[3].trim();
      const right = this.isQuotedLiteral(rightValRaw)
        ? this.stripQuotes(rightValRaw)
        : !isNaN(Number(rightValRaw))
        ? Number(rightValRaw)
        : this.resolvePath(rightValRaw, root, context);

      switch (op) {
        case '==':
        case '===':
          return left === right;
        case '!=':
        case '!==':
          return left !== right;
        case '>':
          return Number(left) > Number(right);
        case '<':
          return Number(left) < Number(right);
        case '>=':
          return Number(left) >= Number(right);
        case '<=':
          return Number(left) <= Number(right);
      }
    }

    const val = this.resolvePath(trimmed, root, context);
    return this.isTruthy(val);
  }

  private static isTruthy(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return value !== 0 && !isNaN(value);
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  }

  // =========================================================================
  // Formatting Helpers (Date, Currency, Number)
  // =========================================================================

  private static formatDate(value: unknown, format: string, locale: string): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(String(value));
    if (isNaN(date.getTime())) return String(value);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    if (format === 'DD.MM.YYYY') return `${day}.${month}.${year}`;
    if (format === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
    if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
    if (format === 'DD.MM.YYYY HH:mm') return `${day}.${month}.${year} ${hours}:${minutes}`;

    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
    } catch {
      return `${year}-${month}-${day}`;
    }
  }

  private static formatCurrency(value: unknown, currencyCode: string, locale: string): string {
    if (value === null || value === undefined || value === '') return '';
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, ''));
    if (isNaN(num)) return String(value);

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode || 'USD',
        minimumFractionDigits: 2,
      }).format(num);
    } catch {
      return `${currencyCode} ${num.toFixed(2)}`;
    }
  }

  private static formatNumber(value: unknown, decimals: number, locale: string): string {
    if (value === null || value === undefined || value === '') return '';
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, ''));
    if (isNaN(num)) return String(value);

    try {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(num);
    } catch {
      return num.toFixed(decimals);
    }
  }

  // =========================================================================
  // Parsing & Escaping Utilities
  // =========================================================================

  private static escapeHtml(str: string): string {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return str.replace(/[&<>'"]/g, (c) => escapeMap[c] || c);
  }

  private static toObject(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : { this: value };
  }

  private static isQuotedLiteral(str: string): boolean {
    return (str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"));
  }

  private static stripQuotes(str: string): string {
    if (this.isQuotedLiteral(str)) {
      return str.slice(1, -1);
    }
    return str;
  }

  private static tokenizeExpression(expr: string): string[] {
    const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
    const tokens: string[] = [];
    let match;
    while ((match = regex.exec(expr)) !== null) {
      tokens.push(match[0]);
    }
    return tokens;
  }
}
