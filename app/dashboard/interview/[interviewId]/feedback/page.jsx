"use client";
import React, { useEffect, useRef, useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  CheckCircle2, 
  XCircle, 
  ChevronsUpDown, 
  Activity, 
  Target,
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
  MailCheck,
  MailWarning,
  Loader2,
  Download
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { buildInterviewReport } from "@/utils/interview-analytics";
import { buildInterviewReportPdf, downloadPdfFile } from "@/utils/report-pdf";

const readinessToneClassMap = {
  success: "border-emerald-200 bg-emerald-50/90 text-emerald-950",
  warning: "border-amber-200 bg-amber-50/90 text-amber-950",
  danger: "border-rose-200 bg-rose-50/90 text-rose-950",
  neutral: "border-slate-200 bg-slate-50/90 text-slate-900",
};

const REPORT_TARGET_QUESTIONS = 12;

const hasDisplayValue = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  !Number.isNaN(Number(value));

const formatScore = (value) => {
  if (!hasDisplayValue(value)) {
    return "N/A";
  }

  const numericValue = Number(value);
  return `${numericValue.toFixed(1).replace(/\.0$/, "")}/10`;
};

const getCoveragePercentage = (count) => {
  if (!hasDisplayValue(count) || REPORT_TARGET_QUESTIONS === 0) {
    return 0;
  }

  return Math.min(100, Math.round((Number(count) / REPORT_TARGET_QUESTIONS) * 100));
};

const Feedback = ({ params }) => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [readiness, setReadiness] = useState({
    label: "Insufficient Data",
    tone: "neutral",
    description: "Complete more interview questions to assess readiness.",
  });
  const [emailStatus, setEmailStatus] = useState("idle");
  const [emailStatusMessage, setEmailStatusMessage] = useState("");
  const [reportData, setReportData] = useState(null);
  const [overallInsights, setOverallInsights] = useState({
    topStrengths: [],
    topImprovementAreas: [],
    futureSuggestions: [],
    scoreReasons: [],
    readinessReasons: [],
    deliverySignals: {
      confidenceScore: null,
      nervousnessScore: null,
      clarityScore: null,
      knowledgeClarityScore: null,
      focusScore: null,
    },
    proctoringSummary: {
      warningsCount: 0,
      hiddenTabEvents: 0,
      noFaceEvents: 0,
      multipleFaceEvents: 0,
      offCenterEvents: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const emailAttemptedRef = useRef(false);

  const sendInterviewReport = async (answers = []) => {
    if (emailAttemptedRef.current || answers.length === 0) {
      return;
    }

    emailAttemptedRef.current = true;
    setEmailStatus("sending");
    setEmailStatusMessage("Generating and sending your interview email report...");

    try {
      const response = await fetch(`/api/interview-report/${params.interviewId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Failed to send interview report.");
      }

      if (data.status === "already_sent") {
        setEmailStatus("sent");
        setEmailStatusMessage("An interview report had already been emailed for this session.");
        return;
      }

      setEmailStatus("sent");
      setEmailStatusMessage("Your interview report was emailed successfully.");
      toast.success("Interview report emailed successfully");
    } catch (error) {
      console.error("Interview report email error:", error);
      setEmailStatus("failed");
      setEmailStatusMessage(error?.message || "Automatic email reporting is not configured yet.");
      toast.error("Unable to send interview report email", {
        description: error?.message || "Please configure the email provider environment variables.",
      });
    }
  };

  useEffect(() => {
    GetFeedback();
  }, []);

  const GetFeedback = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/feedback/${params.interviewId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch interview feedback.");
      }

      const answers = Array.isArray(data?.answers) ? data.answers : [];
      const report = data?.report || buildInterviewReport(answers);
      setReportData(report);

      setFeedbackList(report.feedbackList);
      setAverageRating(hasDisplayValue(report.averageRating) ? String(report.averageRating) : null);
      setOverallInsights(report.overallInsights);
      setReadiness(report.readiness);
      await sendInterviewReport(answers);
    } catch (error) {
      console.error("Feedback load error:", error);
      toast.error("Unable to load interview feedback", {
        description: error?.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating) => {
    if (!hasDisplayValue(rating)) return "text-slate-700";
    const numRating = parseFloat(rating);
    if (numRating >= 8) return "text-green-600";
    if (numRating >= 5) return "text-yellow-600";
    return "text-red-600";
  };

  const getRatingBadgeClass = (rating) => {
    if (!hasDisplayValue(rating)) return "border-slate-200 bg-slate-100 text-slate-700";
    const numRating = parseFloat(rating);
    if (numRating >= 8) return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (numRating >= 5) return "border-amber-200 bg-amber-50 text-amber-700";
    return "border-rose-200 bg-rose-50 text-rose-700";
  };

  const coveragePercentage = getCoveragePercentage(feedbackList.length);
  const isPartialReport = feedbackList.length < REPORT_TARGET_QUESTIONS;
  const executiveSummary = hasDisplayValue(averageRating)
    ? `This report reviewed ${feedbackList.length} answer${feedbackList.length === 1 ? "" : "s"} and placed your performance at ${formatScore(averageRating)} with a readiness level of ${readiness.label}.`
    : `This report reviewed ${feedbackList.length} answer${feedbackList.length === 1 ? "" : "s"} and needs more evaluated responses before a stable overall score can be shown.`;

  const downloadInterviewReport = () => {
    if (!reportData) {
      return;
    }

    const bytes = buildInterviewReportPdf(reportData);
    downloadPdfFile(
      `${(reportData?.interview?.jobPosition || "interview-report").replace(/\s+/g, "-").toLowerCase()}-report.pdf`,
      bytes
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="text-center">
          <Activity className="mx-auto h-12 w-12 animate-pulse text-indigo-600" />
          <p className="mt-4 text-sm font-medium text-slate-600">Loading your interview feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
      <div className="mx-auto w-full max-w-[1680px]">
      {feedbackList.length === 0 ? (
        <Card className="mx-auto max-w-2xl rounded-[30px] border-slate-200 bg-white shadow-sm">
          <CardHeader className="text-center">
            <XCircle className="mx-auto h-16 w-16 text-red-500" />
            <h2 className="mt-4 text-2xl font-bold text-slate-900">
              No Interview Feedback Available
            </h2>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6 text-slate-600">
              It seems like no feedback has been generated for this interview.
              This could be due to an incomplete interview or a system issue.
            </p>
            <Button
              variant="outline"
              onClick={() => router.replace('/dashboard')}
              className="w-full sm:w-auto"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6 overflow-hidden rounded-[34px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,#eff6ff_0%,#ffffff_42%,#f8fafc_100%)] p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Interview Performance Report
                </div>
                <h1 className="mt-5 max-w-5xl text-[2.2rem] font-semibold tracking-tight text-slate-900 sm:text-[3rem]">
                  A clearer, more professional report for fast review and better next-step practice
                </h1>
                <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600">
                  {executiveSummary}
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Overall Score</p>
                    <p className={`mt-3 text-3xl font-semibold tracking-tight ${getRatingColor(averageRating)}`}>
                      {formatScore(averageRating)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">Average rating across reviewed answers</p>
                  </div>
                  <div className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Coverage</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{coveragePercentage}%</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{feedbackList.length}/{REPORT_TARGET_QUESTIONS} target questions evaluated</p>
                  </div>
                  <div className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Session Status</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{isPartialReport ? "Partial" : "Complete"}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {isPartialReport
                        ? "Generated from the answers captured before the session ended."
                        : "Generated from a completed mock interview."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className={`rounded-[28px] border p-6 shadow-sm ${readinessToneClassMap[readiness.tone] || readinessToneClassMap.neutral}`}>
                  <h2 className="text-2xl font-bold">{readiness.label}</h2>
                  <p className="mt-3 text-sm leading-7">{readiness.description}</p>
                  <div className="mt-5">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] opacity-70">Why This Readiness Level</h3>
                    <ul className="mt-3 space-y-3 text-sm">
                  {overallInsights.readinessReasons.length > 0 ? overallInsights.readinessReasons.map((reason, index) => (
                    <li key={index} className="rounded-2xl border border-current/10 bg-white/75 p-4 leading-6">
                      {reason}
                    </li>
                  )) : (
                    <li className="rounded-2xl border border-current/10 bg-white/75 p-4 leading-6">
                      Readiness details will appear as more evaluated answers are available.
                    </li>
                  )}
                </ul>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-2xl p-3 ${emailStatus === "failed" ? "bg-red-50 text-red-600" : emailStatus === "sending" ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"}`}>
                      {emailStatus === "failed" ? (
                        <MailWarning className="h-5 w-5" />
                      ) : emailStatus === "sending" ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <MailCheck className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Email Report</p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">
                        {emailStatus === "sending"
                          ? "Sending automatic report"
                          : emailStatus === "failed"
                          ? "Automatic report unavailable"
                          : emailStatus === "sent"
                          ? "Automatic report delivered"
                          : "Automatic report status"}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-500">
                        {emailStatusMessage || "A polished summary report is sent automatically after interview completion."}
                      </p>
                      <div className="mt-4">
                        <Button type="button" variant="outline" onClick={downloadInterviewReport} className="rounded-2xl">
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF Report
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="rounded-[26px] border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Readiness</p>
                <h2 className="text-2xl font-semibold text-slate-900">{readiness.label}</h2>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-500">Overall interview readiness assessment.</p>
              </CardContent>
            </Card>
            <Card className="rounded-[26px] border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Questions Reviewed</p>
                <h2 className="text-2xl font-semibold text-slate-900">{feedbackList.length}</h2>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-500">Responses included in this report.</p>
              </CardContent>
            </Card>
            <Card className="rounded-[26px] border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Strongest Signal</p>
                <h2 className="text-2xl font-semibold text-slate-900">{overallInsights.topStrengths.length > 0 ? "Strength Found" : "Pending"}</h2>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-500">{overallInsights.topStrengths[0] || "Strength trends will appear after more evaluated answers."}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[26px] border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Main Priority</p>
                <h2 className="text-2xl font-semibold text-slate-900">{overallInsights.topImprovementAreas.length > 0 ? "Needs Work" : "Pending"}</h2>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-500">{overallInsights.topImprovementAreas[0] || "Improvement priorities will appear after more evaluated answers."}</p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-6">
            <Card className="rounded-[30px] border-slate-200 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center gap-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Session Summary</h2>
                  <p className="text-slate-600">
                    {feedbackList.length < REPORT_TARGET_QUESTIONS
                      ? "This is a partial interview report generated from the answers you completed before ending or leaving the interview."
                      : "You've completed your mock interview."}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-slate-500">Overall Rating</p>
                    <p className={`text-2xl font-bold ${getRatingColor(averageRating)}`}>
                      {formatScore(averageRating)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Questions</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {feedbackList.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Coverage</p>
                    <p className="text-2xl font-bold text-slate-900">{coveragePercentage}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="rounded-[28px] border-slate-200 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center gap-3">
                <BrainCircuit className="h-6 w-6 text-indigo-600" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Why You Got This Score</h3>
                  <p className="text-sm text-slate-500">Explainable AI reasons behind your rating</p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-slate-700">
                  {overallInsights.scoreReasons.length > 0 ? overallInsights.scoreReasons.map((reason, index) => (
                    <li key={index} className="rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4 leading-6">
                      {reason}
                    </li>
                  )) : (
                    <li className="text-slate-500">Detailed score reasoning will appear after more evaluated answers.</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-slate-200 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center gap-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">What You Did Well</h3>
                  <p className="text-sm text-slate-500">Most repeated strengths across your answers</p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-slate-700">
                  {overallInsights.topStrengths.length > 0 ? overallInsights.topStrengths.map((strength, index) => (
                    <li key={index} className="rounded-2xl border border-green-100 bg-green-50/80 p-4 leading-6">
                      {strength}
                    </li>
                  )) : (
                    <li className="text-slate-500">No strengths captured yet.</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-slate-200 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Areas To Improve</h3>
                  <p className="text-sm text-slate-500">Main weaknesses affecting your score</p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-slate-700">
                  {overallInsights.topImprovementAreas.length > 0 ? overallInsights.topImprovementAreas.map((item, index) => (
                    <li key={index} className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 leading-6">
                      {item}
                    </li>
                  )) : (
                    <li className="text-slate-500">No improvement areas captured yet.</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-slate-200 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center gap-3">
                <Lightbulb className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Future Suggestions</h3>
                  <p className="text-sm text-slate-500">Practical next steps for upcoming interviews</p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-slate-700">
                  {overallInsights.futureSuggestions.length > 0 ? overallInsights.futureSuggestions.map((item, index) => (
                    <li key={index} className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 leading-6">
                      {item}
                    </li>
                  )) : (
                    <li className="text-slate-500">No future suggestions captured yet.</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Confidence", value: overallInsights.deliverySignals.confidenceScore, color: "text-indigo-700 bg-indigo-50 border-indigo-100" },
              { label: "Nervousness", value: overallInsights.deliverySignals.nervousnessScore, color: "text-red-700 bg-red-50 border-red-100" },
              { label: "Clarity", value: overallInsights.deliverySignals.clarityScore, color: "text-blue-700 bg-blue-50 border-blue-100" },
              { label: "Knowledge Clarity", value: overallInsights.deliverySignals.knowledgeClarityScore, color: "text-green-700 bg-green-50 border-green-100" },
              { label: "Focus", value: overallInsights.deliverySignals.focusScore, color: "text-amber-700 bg-amber-50 border-amber-100" },
            ].map((metric) => (
              <Card key={metric.label} className="rounded-[24px] border-0 bg-transparent shadow-none">
                <CardContent className={`rounded-[24px] border p-5 shadow-sm ${metric.color}`}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">{metric.label}</p>
                  <p className="mt-3 text-3xl font-bold">{formatScore(metric.value)}</p>
                  <p className="mt-2 text-xs leading-5 opacity-80">Heuristic delivery signal</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mb-6">
            <Card className="rounded-[30px] border-slate-200 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Interview Monitoring Summary</h3>
                  <p className="text-sm text-slate-500">Camera and tab-behavior checks captured during the session</p>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-[22px] border border-red-100 bg-red-50/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Warnings</p>
                  <p className="text-xl font-bold text-red-700">{overallInsights.proctoringSummary.warningsCount}</p>
                </div>
                <div className="rounded-[22px] border border-amber-100 bg-amber-50/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Hidden Tabs</p>
                  <p className="text-xl font-bold text-amber-700">{overallInsights.proctoringSummary.hiddenTabEvents}</p>
                </div>
                <div className="rounded-[22px] border border-indigo-100 bg-indigo-50/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">No Face</p>
                  <p className="text-xl font-bold text-indigo-700">{overallInsights.proctoringSummary.noFaceEvents}</p>
                </div>
                <div className="rounded-[22px] border border-purple-100 bg-purple-50/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Multiple Faces</p>
                  <p className="text-xl font-bold text-purple-700">{overallInsights.proctoringSummary.multipleFaceEvents}</p>
                </div>
                <div className="rounded-[22px] border border-sky-100 bg-sky-50/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Off Center</p>
                  <p className="text-xl font-bold text-sky-700">{overallInsights.proctoringSummary.offCenterEvents}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-slate-900">
              Detailed Interview Feedback
            </h3>
            <p className="mb-4 text-sm text-slate-500">
              Review each question's score, the reasoning behind it, and the specific improvements to focus on.
            </p>

            {feedbackList.map((item, index) => (
              <Collapsible key={index} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                <CollapsibleTrigger className="w-full">
                  <div className="flex flex-col gap-4 bg-slate-50/80 p-5 transition-colors hover:bg-slate-100 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <Target className={`mt-1 h-5 w-5 shrink-0 ${getRatingColor(item.rating)}`} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Q{index + 1}
                          </span>
                          <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${getRatingBadgeClass(item.rating)}`}>
                            {formatScore(item.rating)}
                          </span>
                        </div>
                        <span className="mt-3 block font-medium leading-7 text-slate-900">
                        {item.question}
                        </span>
                      </div>
                    </div>
                    <ChevronsUpDown className="h-4 shrink-0 text-slate-500" />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="bg-white p-5">
                  <div className="grid gap-4 xl:grid-cols-2">
                    <div>
                      <h4 className="mb-2 font-semibold text-slate-700">Your Answer</h4>
                      <p className="rounded-[20px] border border-red-200 bg-red-50/80 p-4 text-sm leading-7 text-red-950">
                        {item.userAns || "No answer provided"}
                      </p>
                    </div>
                    <div>
                      <h4 className="mb-2 font-semibold text-slate-700">Reference Answer</h4>
                      <p className="rounded-[20px] border border-green-200 bg-green-50/80 p-4 text-sm leading-7 text-green-950">
                        {item.correctAns}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="mb-2 font-semibold text-slate-700">Score Summary</h4>
                    <p className="rounded-[20px] border border-blue-200 bg-blue-50/80 p-4 text-sm leading-7 text-slate-700">
                      {item.feedbackDetails.feedback}
                    </p>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="mb-2 font-semibold text-slate-700">Why This Score</h4>
                      <ul className="space-y-2">
                        {item.feedbackDetails.scoreReasoning.length > 0 ? item.feedbackDetails.scoreReasoning.map((reason, reasonIndex) => (
                          <li key={reasonIndex} className="rounded-[18px] border border-indigo-100 bg-indigo-50/80 p-4 text-sm leading-6 text-indigo-950">
                            {reason}
                          </li>
                        )) : (
                          <li className="text-sm text-slate-500">No score reasoning available.</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-2 font-semibold text-slate-700">Strengths</h4>
                      <ul className="space-y-2">
                        {item.feedbackDetails.strengths.length > 0 ? item.feedbackDetails.strengths.map((strength, strengthIndex) => (
                          <li key={strengthIndex} className="rounded-[18px] border border-green-100 bg-green-50/80 p-4 text-sm leading-6 text-green-950">
                            {strength}
                          </li>
                        )) : (
                          <li className="text-sm text-slate-500">No strengths available.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="mb-2 font-semibold text-slate-700">Areas To Improve</h4>
                      <ul className="space-y-2">
                        {item.feedbackDetails.improvementAreas.length > 0 ? item.feedbackDetails.improvementAreas.map((area, areaIndex) => (
                          <li key={areaIndex} className="rounded-[18px] border border-amber-100 bg-amber-50/80 p-4 text-sm leading-6 text-amber-950">
                            {area}
                          </li>
                        )) : (
                          <li className="text-sm text-slate-500">No improvement areas available.</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-2 font-semibold text-slate-700">Future Suggestions</h4>
                      <ul className="space-y-2">
                        {item.feedbackDetails.futureSuggestions.length > 0 ? item.feedbackDetails.futureSuggestions.map((suggestion, suggestionIndex) => (
                          <li key={suggestionIndex} className="rounded-[18px] border border-sky-100 bg-sky-50/80 p-4 text-sm leading-6 text-sky-950">
                            {suggestion}
                          </li>
                        )) : (
                          <li className="text-sm text-slate-500">No future suggestions available.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  {item.feedbackDetails.deliverySignals && (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                      {[
                        { label: "Confidence", value: item.feedbackDetails.deliverySignals.confidenceScore },
                        { label: "Nervousness", value: item.feedbackDetails.deliverySignals.nervousnessScore },
                        { label: "Clarity", value: item.feedbackDetails.deliverySignals.clarityScore },
                        { label: "Knowledge", value: item.feedbackDetails.deliverySignals.knowledgeClarityScore },
                        { label: "Focus", value: item.feedbackDetails.deliverySignals.focusScore },
                      ].map((metric) => (
                        <div key={metric.label} className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{metric.label}</p>
                          <p className="mt-2 text-lg font-bold text-slate-900">{formatScore(metric.value)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {item.feedbackDetails.deliverySignals?.indicators?.length > 0 && (
                    <div className="mt-4">
                      <h4 className="mb-2 font-semibold text-slate-700">Observed Delivery Indicators</h4>
                      <ul className="space-y-2">
                        {item.feedbackDetails.deliverySignals.indicators.map((indicator, indicatorIndex) => (
                          <li key={indicatorIndex} className="rounded-[18px] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-900">
                            {indicator}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-4 text-right">
                    <span className={`font-bold ${getRatingColor(item.rating)}`}>
                      Rating: {formatScore(item.rating)}
                    </span>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}

            <div className="mt-8 text-center">
              <Button
                onClick={() => router.replace('/dashboard')}
                className="w-full md:w-auto"
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default Feedback;
