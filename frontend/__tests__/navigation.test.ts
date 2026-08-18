import {locales, localePrefix} from '@/navigation';

describe('navigation config', () => {
  it('supports en and fa', () => {
    expect(locales).toContain('en');
    expect(locales).toContain('fa');
  });

  it('always prefixes locale in URLs', () => {
    expect(localePrefix).toBe('always');
  });
});
