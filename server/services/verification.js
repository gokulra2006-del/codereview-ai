import { executeTestCasesConcurrently, LANGUAGE_MAP } from "./judge0.js";

export async function verifyPatches({
  originalCode,
  patchedCode,
  language,
  findings = [],
  acceptedFixes = [],
  approvedTests = [],
  originalScore = 70,
}) {
  const languageId = LANGUAGE_MAP[language];
  const totalFindings = findings.length;

  const acceptedSet = new Set(acceptedFixes);
  const fixedFindings = [];
  const stillPresentFindings = [];

  for (const finding of findings) {
    if (acceptedSet.has(finding.id)) {
      fixedFindings.push(finding);
    } else {
      stillPresentFindings.push(finding);
    }
  }

  // Execute tests against patched code (and original code when available to verify delta)
  let patchedTestResults = null;
  let originalTestResults;
  const behaviorChanges = [];

  if (approvedTests.length > 0 && languageId) {
    [patchedTestResults, originalTestResults] = await Promise.all([
      executeTestCasesConcurrently(patchedCode, languageId, approvedTests, 3),
      originalCode !== patchedCode
        ? executeTestCasesConcurrently(originalCode, languageId, approvedTests, 3)
        : Promise.resolve(null),
    ]);

    // Compare test results between before and after
    for (let i = 0; i < approvedTests.length; i++) {
      const pRes = patchedTestResults.results[i];
      const oRes = originalTestResults?.results?.[i];

      if (oRes && !oRes.passed && pRes.passed) {
        behaviorChanges.push(`Resolved regression: "${pRes.name}" passed after patch (previously failed).`);
      } else if (oRes && oRes.passed && !pRes.passed) {
        behaviorChanges.push(`Warning: "${pRes.name}" passed before but failed after patch.`);
      } else if (pRes.passed) {
        behaviorChanges.push(`Verified: "${pRes.name}" passed expected assertions.`);
      }
    }
  }

  const isVerified = Boolean(
    fixedFindings.length > 0 && originalCode !== patchedCode &&
    approvedTests.length > 0 && patchedTestResults &&
    patchedTestResults.total === approvedTests.length && patchedTestResults.failed === 0
  );
  // Applying a suggestion does not establish correctness or a new quality score.
  const finalScore = originalScore;
  const verificationConfidence = isVerified ? 0.7 : 0;

  return {
    verified: isVerified,
    verificationMethod: approvedTests.length > 0 ? "dynamic_execution_assertion" : "not_verified",
    scoreBefore: originalScore,
    scoreAfter: finalScore,
    scoreImprovement: finalScore - originalScore,
    findingsFixed: [],
    findingsApplied: fixedFindings.map((f) => ({ id: f.id, title: f.title, severity: f.severity })),
    limitations: "Passing selected tests does not prove every finding resolved. Applied fixes require further review; the quality score has not been reassessed.",
    findingsStillPresent: stillPresentFindings.map((f) => ({ id: f.id, title: f.title, severity: f.severity })),
    testsPassed: patchedTestResults?.passed ?? 0,
    testsFailed: patchedTestResults?.failed ?? 0,
    totalTestsExecuted: approvedTests.length,
    testResults: patchedTestResults?.results ?? [],
    behaviorChanges,
    verificationConfidence,
    timestamp: new Date().toISOString(),
  };
}
