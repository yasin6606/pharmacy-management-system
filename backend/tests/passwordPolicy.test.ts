import {passwordSchema} from '../src/core/utils/passwordPolicy';

describe('passwordSchema', () => {
    it('accepts strong enough passwords', () => {
        expect(passwordSchema.parse('secret12')).toBe('secret12');
    });

    it('rejects short passwords', () => {
        expect(() => passwordSchema.parse('ab12')).toThrow();
    });

    it('rejects letters-only', () => {
        expect(() => passwordSchema.parse('abcdefgh')).toThrow();
    });

    it('rejects digits-only', () => {
        expect(() => passwordSchema.parse('12345678')).toThrow();
    });
});
