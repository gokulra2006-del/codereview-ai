import { useState } from "react";
import toast from "react-hot-toast";

export function usePatchManager({ code, setCode, originalCodeSnapshot, setOriginalCodeSnapshot }) {
  // Stacks for undo operations
  const [historyStack, setHistoryStack] = useState([]);
  const [acceptedFixes, setAcceptedFixes] = useState([]);
  const [rejectedFixes, setRejectedFixes] = useState([]);

  // Active finding for Diff Preview Modal
  const [previewingIssue, setPreviewingIssue] = useState(null);
  const [previewProposedCode, setPreviewProposedCode] = useState("");
  const [patchConflictWarning, setPatchConflictWarning] = useState(null);

  const calculateProposedPatch = (currentCode, issue) => {
    const lines = currentCode.split("\n");
    const { startLine, endLine, suggestedReplacement } = issue;

    if (startLine < 1 || startLine > lines.length) {
      return {
        hasConflict: true,
        reason: `Target start line (${startLine}) is outside the file bounds (1-${lines.length}).`,
        proposedCode: currentCode,
      };
    }

    const beforeLines = lines.slice(0, startLine - 1);
    const afterLines = lines.slice(endLine);

    // Replacement lines
    const repLines = suggestedReplacement ? suggestedReplacement.split("\n") : [];
    const proposed = [...beforeLines, ...repLines, ...afterLines].join("\n");

    return {
      hasConflict: false,
      reason: null,
      proposedCode: proposed,
    };
  };

  const openDiffPreview = (issue) => {
    // Check if source code lines have drastically shifted
    const { hasConflict, reason, proposedCode } = calculateProposedPatch(code, issue);
    setPreviewingIssue(issue);
    setPreviewProposedCode(proposedCode);
    setPatchConflictWarning(hasConflict ? reason : null);
  };

  const closeDiffPreview = () => {
    setPreviewingIssue(null);
    setPreviewProposedCode("");
    setPatchConflictWarning(null);
  };

  const applyFix = (issue) => {
    const { hasConflict, reason, proposedCode } = calculateProposedPatch(code, issue);

    if (hasConflict) {
      toast.error(`Cannot apply fix: ${reason}`);
      return false;
    }

    // Save snapshot of current code to history stack for Undo
    setHistoryStack((prev) => [
      ...prev,
      {
        previousCode: code,
        issueId: issue.id,
        issueTitle: issue.title,
        timestamp: Date.now(),
      },
    ]);

    // Track accepted fix
    setAcceptedFixes((prev) => (prev.includes(issue.id) ? prev : [...prev, issue.id]));
    setRejectedFixes((prev) => prev.filter((id) => id !== issue.id));

    // Update editor code
    setCode(proposedCode);
    closeDiffPreview();
    toast.success(`Applied fix: "${issue.title}" (Ctrl+Z or Undo available)`);
    return true;
  };

  const rejectFix = (issue) => {
    setRejectedFixes((prev) => (prev.includes(issue.id) ? prev : [...prev, issue.id]));
    setAcceptedFixes((prev) => prev.filter((id) => id !== issue.id));
    closeDiffPreview();
    toast("Fix marked as rejected", { icon: "✕" });
  };

  const undoLastFix = () => {
    if (historyStack.length === 0) {
      toast("No applied fixes to undo.", { icon: "ℹ️" });
      return;
    }

    const last = historyStack[historyStack.length - 1];
    const newStack = historyStack.slice(0, -1);

    setCode(last.previousCode);
    setHistoryStack(newStack);
    setAcceptedFixes((prev) => prev.filter((id) => id !== last.issueId));

    toast.success(`Undid fix: "${last.issueTitle}"`);
  };

  const resetAllPatches = () => {
    if (originalCodeSnapshot && originalCodeSnapshot !== code) {
      setCode(originalCodeSnapshot);
      setHistoryStack([]);
      setAcceptedFixes([]);
      setRejectedFixes([]);
      toast("Reset code to original review state", { icon: "🔄" });
    }
  };

  return {
    historyStack,
    acceptedFixes,
    rejectedFixes,
    previewingIssue,
    previewProposedCode,
    patchConflictWarning,
    openDiffPreview,
    closeDiffPreview,
    applyFix,
    rejectFix,
    undoLastFix,
    resetAllPatches,
  };
}
