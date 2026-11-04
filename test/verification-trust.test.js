import { describe, it, expect, vi } from 'vitest';
vi.mock('../server/services/judge0.js', () => ({
  LANGUAGE_MAP: { javascript: 63 },
  executeTestCasesConcurrently: vi.fn(async () => ({ total: 1, passed: 1, failed: 0, results: [{ passed: true, name: 'example' }] })),
}));
import { verifyPatches } from '../server/services/verification.js';

describe('verification evidence', () => {
  const input = { originalCode: 'old', patchedCode: 'new', language: 'javascript', findings: [{ id: 'a' }], acceptedFixes: ['a'], originalScore: 70 };
  it('does not verify an applied fix without tests', async () => {
    const report = await verifyPatches(input);
    expect(report.verified).toBe(false);
    expect(report.scoreAfter).toBe(70);
    expect(report.findingsFixed).toEqual([]);
  });
  it('reports passing tests without inventing a quality score', async () => {
    const report = await verifyPatches({ ...input, approvedTests: [{ input: '', expectedOutput: 'ok' }] });
    expect(report.verified).toBe(true);
    expect(report.scoreImprovement).toBe(0);
    expect(report.findingsApplied).toHaveLength(1);
  });
  it('does not verify unchanged code', async () => {
    expect((await verifyPatches({ ...input, patchedCode: 'old', approvedTests: [{}] })).verified).toBe(false);
  });
});
