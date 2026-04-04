import { describe, it, expect } from 'vitest';
import { config } from './config';

describe('config', () => {
  it('has required DVF settings', () => {
    expect(config.DVF_RESOURCE_ID).toBe('d7933994-2c66-4131-a4da-cf7cd18040a4');
    expect(config.DVF_API_BASE).toContain('tabular-api.data.gouv.fr');
    expect(config.MAX_DVF_PAGES).toBeGreaterThan(0);
    expect(config.MIN_COMPARABLES).toBeGreaterThan(0);
    expect(config.TARGET_COMPARABLES).toBeGreaterThanOrEqual(config.MIN_COMPARABLES);
  });

  it('has required BAN settings', () => {
    expect(config.BAN_API_BASE).toContain('api-adresse.data.gouv.fr');
  });

  it('has valid default radius', () => {
    expect(config.DEFAULT_RADIUS_M).toBeGreaterThan(0);
    expect(config.DEFAULT_RADIUS_M).toBeLessThanOrEqual(5000);
  });
});
