import { useState } from "react";
import toast from "react-hot-toast";
import { reviewCode, generateRegressionTests, verifyFixes } from "../services/api";

export function useCodeReview({ checkQuota, refreshQuota, triggerLimitModal, activeModeConfig }) {
  const [structuredReview, setStructuredReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState(null);

  // Verification state (Phase 4)
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationReport, setVerificationReport] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const handleReview = async (code, language, model = null) => {
    if (activeModeConfig?.blockReview) {
      toast.error(`AI Review is disabled in ${activeModeConfig.title} mode.`);
      return;
    }

    if (!checkQuota("review")) return;

    try {
      setLoading(true);
      setSelectedIssueId(null);
      const data = await reviewCode(code, language, model);

      if (data?.review) {
        setStructuredReview(data.review);
        toast.success(`AI Review Generated · Score: ${data.review.overallScore}/100`);
      }
      refreshQuota();
    } catch (err) {
      if (err.code === "QUOTA_EXCEEDED") {
        triggerLimitModal("review");
      } else {
        toast.error(err.message || "Review Failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTests = async (code, language) => {
    if (!structuredReview?.issues || structuredReview.issues.length === 0) {
      toast("Run an AI review first to identify targets for regression tests.", { icon: "ℹ️" });
      return [];
    }

    try {
      toast.loading("Generating focused regression tests...", { id: "gen-tests" });
      const data = await generateRegressionTests(code, language, structuredReview.issues);
      toast.success(`Generated ${data.tests?.length || 0} regression tests`, { id: "gen-tests" });
      return data.tests || [];
    } catch (err) {
      toast.error(err.message || "Failed to generate tests", { id: "gen-tests" });
      return [];
    }
  };

  const handleVerifyFixes = async ({
    originalCode,
    patchedCode,
    language,
    acceptedFixes,
    approvedTests,
  }) => {
    try {
      setVerificationLoading(true);
      const data = await verifyFixes({
        originalCode,
        patchedCode,
        language,
        findings: structuredReview?.issues || [],
        acceptedFixes,
        approvedTests,
        originalScore: structuredReview?.overallScore || 70,
      });

      if (data?.verification) {
        setVerificationReport(data.verification);
        setShowVerificationModal(true);
        if (data.verification.verified) {
          toast.success("Fixes Verified! All regression checks passed.");
        } else {
          toast("Verification completed with warnings.", { icon: "⚠️" });
        }
      }
      return data?.verification;
    } catch (err) {
      toast.error(err.message || "Verification failed");
    } finally {
      setVerificationLoading(false);
    }
  };

  return {
    structuredReview,
    setStructuredReview,
    loading,
    selectedIssueId,
    setSelectedIssueId,
    handleReview,
    handleGenerateTests,
    handleVerifyFixes,
    verificationLoading,
    verificationReport,
    showVerificationModal,
    setShowVerificationModal,
  };
}
