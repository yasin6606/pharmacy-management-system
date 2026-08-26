import {signToken, verifyToken} from '../src/core/utils/jwt';

describe('jwt utils', () => {
    it('signs and verifies a payload', () => {
        const token = signToken({userId: 'u1', role: 'manager', sessionId: 's1', branchId: 'b1'});
        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3);

        const decoded = verifyToken(token);
        expect(decoded.userId).toBe('u1');
        expect(decoded.role).toBe('manager');
        expect(decoded.sessionId).toBe('s1');
        expect(decoded.branchId).toBe('b1');
    });

    it('throws on tampered token', () => {
        const token = signToken({userId: 'u1', role: 'manager', sessionId: 's1'});
        const bad = token.slice(0, -4) + 'xxxx';
        expect(() => verifyToken(bad)).toThrow();
    });

    it('rejects tokens missing required claims', () => {
        const token = signToken({userId: 'u1', role: 'junior', sessionId: 's2'});
        const decoded = verifyToken(token);
        expect(decoded.sessionId).toBe('s2');
    });
});
