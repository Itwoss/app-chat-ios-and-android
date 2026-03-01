import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getApiUrl, getApiBaseUrl, isProduction, isDevelopment } from './apiUrl';

describe('apiUrl utils', () => {
  const originalEnv = import.meta.env;

  afterEach(() => {
    import.meta.env = originalEnv;
  });

  describe('getApiUrl', () => {
    it('returns string', () => {
      expect(typeof getApiUrl()).toBe('string');
    });

    it('getApiBaseUrl returns same as getApiUrl', () => {
      expect(getApiBaseUrl()).toBe(getApiUrl());
    });
  });

  describe('isProduction', () => {
    it('returns a boolean', () => {
      expect(typeof isProduction()).toBe('boolean');
    });
  });

  describe('isDevelopment', () => {
    it('returns a boolean', () => {
      expect(typeof isDevelopment()).toBe('boolean');
    });
  });
});
