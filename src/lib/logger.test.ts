import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger } from './logger';

describe('logger', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('préfixe les messages avec le scope', () => {
    const log = createLogger('TestScope');
    log.error('boom');
    expect(errorSpy).toHaveBeenCalledWith('[TestScope] boom');
  });

  it('passe le context en second argument quand fourni', () => {
    const log = createLogger('S');
    log.error('failed', { userId: 42 });
    expect(errorSpy).toHaveBeenCalledWith('[S] failed', { userId: 42 });
  });

  it('utilise console.error pour error, console.warn pour warn, console.log sinon', () => {
    const log = createLogger('S');
    log.error('e');
    log.warn('w');
    log.info('i');
    log.debug('d');
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    // info + debug -> console.log (en non-prod)
    expect(logSpy.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});
