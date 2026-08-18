import {ApiError} from '@/lib/api';

describe('ApiError', () => {
  it('exposes status and message', () => {
    const err = new ApiError(404, 'Not found', {code: 'MISSING'});
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ApiError');
    expect(err.status).toBe(404);
    expect(err.message).toBe('Not found');
    expect(err.data).toEqual({code: 'MISSING'});
  });
});
