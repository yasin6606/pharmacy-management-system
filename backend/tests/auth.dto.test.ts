import {loginSchema} from '../src/modules/auth/dto/auth.dto';

describe('loginSchema', () => {
    it('accepts valid credentials', () => {
        const parsed = loginSchema.parse({
            body: {email: 'user@example.com', password: 'secret1'},
        });
        expect(parsed.body.email).toBe('user@example.com');
    });

    it('rejects invalid email', () => {
        expect(() =>
            loginSchema.parse({body: {email: 'nope', password: 'secret1'}})
        ).toThrow();
    });

    it('rejects short password', () => {
        expect(() =>
            loginSchema.parse({body: {email: 'user@example.com', password: '123'}})
        ).toThrow();
    });
});
