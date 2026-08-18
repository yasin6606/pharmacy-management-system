import {signToken, verifyToken} from '../src/core/utils/jwt';

describe('jwt utils', () => {
    it('signs and verifies a payload', () => {
        const token = signToken({userId: 'u1', role: 'manager'});
        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3);

        const decoded = verifyToken(token);
        expect(decoded.userId).toBe('u1');
        expect(decoded.role).toBe('manager');
    });

    it('throws on tampered token', () => {
        const token = signToken({userId: 'u1'});
        const bad = token.slice(0, -4) + 'xxxx';
        expect(() => verifyToken(bad)).toThrow();
    });
});
