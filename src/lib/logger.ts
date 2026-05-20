/**
 * Logger applicatif centralisé.
 *
 * Objectifs :
 * - Filtrage par niveau (debug/info/warn/error)
 * - Tag de scope (ex: '[EmployeeService]') systématique
 * - Silence des logs debug/info en production
 * - Point d'extension unique pour brancher Sentry / Datadog / Logflare plus tard
 *
 * Utilisation :
 *   const log = createLogger('EmployeeService');
 *   log.debug('Fetching employees');
 *   log.error('Failed to load employee', { id, error });
 *
 * Migration depuis console.* :
 *   console.error('[X] Erreur', err) -> log.error('Erreur', { err })
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const isProd = process.env.NODE_ENV === 'production';
const MIN_LEVEL: LogLevel = isProd ? 'warn' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[MIN_LEVEL];
}

function format(scope: string, level: LogLevel, message: string): string {
  return `[${scope}] ${message}`;
}

export interface Logger {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
}

export function createLogger(scope: string): Logger {
  const emit = (level: LogLevel) => (message: string, context?: Record<string, unknown>) => {
    if (!shouldLog(level)) return;
    const formatted = format(scope, level, message);
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    if (context !== undefined) {
      fn(formatted, context);
    } else {
      fn(formatted);
    }
    // Hook futur : envoi vers Sentry / autre service de monitoring
    // if (level === 'error' && typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureMessage(formatted, { level, extra: context });
    // }
  };

  return {
    debug: emit('debug'),
    info: emit('info'),
    warn: emit('warn'),
    error: emit('error'),
  };
}
