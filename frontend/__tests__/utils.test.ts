import {cn} from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toContain('px-2');
    expect(cn('px-2', 'py-1')).toContain('py-1');
  });

  it('resolves tailwind conflicts via twMerge', () => {
    // later padding should win
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('ignores falsy values', () => {
    expect(cn('a', false && 'b', undefined, 'c')).toBe('a c');
  });
});
