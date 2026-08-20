import { describe, expect, it } from 'vitest';
import { toOffset } from '../pagination';

describe('toOffset', () => {
    it('should return offset 0 for the first page', () => {
        expect(toOffset({ page: 1, limit: 25 })).toBe(0);
    });
});