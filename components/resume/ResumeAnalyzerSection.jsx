"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Download,
  FileSearch,
  FileText,
  Loader2,
  Eye,
  Sparkles,
  Target,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { extractJsonFromText } from "@/utils/gemini-response";
import { extractReadableText, formatFileSize } from "@/utils/resume-utils";
import { JOB_ROLE_SUGGESTIONS, TECH_STACK_SUGGESTIONS } from "@/utils/roles";
import { buildResumeReportPdf, downloadPdfFile } from "@/utils/report-pdf";

const buildEmptyReport = () => ({
  atsScore: 0,
  overallVerdict: "",
  summary: "",
  strengths: [],
  issues: [],
  keywordGaps: [],
  sectionFeedback: [],
  actionPlan: [],
  rewrittenSummary: "",
});

const buildFallbackResumeReport = (parsed = {}, { targetRole = "", targetStack = "", resumeFileName = "" } = {}) => {
  const roleLabel = targetRole || "the selected role";
  const stackLabel = targetStack || "the target skills";
  const summary = String(parsed?.summary || "").trim();
  const verdict = String(parsed?.overallVerdict || "").trim();
  const rewrittenSummary = String(parsed?.rewrittenSummary || "").trim();

  return {
    atsScore: Number(parsed?.atsScore || 0),
    overallVerdict: verdict || "Resume review generated.",
    summary:
      summary ||
      `This resume shows relevant potential for ${roleLabel}, but it needs sharper impact, stronger role alignment, and clearer recruiter-facing structure.`,
    strengths:
      Array.isArray(parsed?.strengths) && parsed.strengths.length
        ? parsed.strengths.slice(0, 6)
        : [
            "Resume review was generated successfully.",
            `The profile shows at least some alignment with ${roleLabel}.`,
            "Core resume structure is present and readable.",
          ],
    issues:
      Array.isArray(parsed?.issues) && parsed.issues.length
        ? parsed.issues.slice(0, 6)
        : [
            "Add more measurable impact in project and experience bullets.",
            `Improve alignment with ${roleLabel} by using clearer role-specific language.`,
            "Strengthen the summary so recruiters understand your value quickly.",
          ],
    keywordGaps:
      Array.isArray(parsed?.keywordGaps) && parsed.keywordGaps.length
        ? parsed.keywordGaps.slice(0, 8)
        : [roleLabel, stackLabel, "impact metrics", "ownership"],
    sectionFeedback:
      Array.isArray(parsed?.sectionFeedback) && parsed.sectionFeedback.length
        ? parsed.sectionFeedback.slice(0, 6)
        : [
            { section: "Professional Summary", feedback: "Make the summary shorter, role-specific, and outcome-focused." },
            { section: "Experience", feedback: "Add metrics, ownership, and business or technical impact to each bullet." },
            { section: "Projects", feedback: "Highlight problem, solution, stack, and measurable result more clearly." },
            { section: "Skills", feedback: "Prioritize the most relevant tools and technologies for the target role." },
          ],
    actionPlan:
      Array.isArray(parsed?.actionPlan) && parsed.actionPlan.length
        ? parsed.actionPlan.slice(0, 6)
        : [
            "Rewrite the top summary for the exact target role.",
            "Add numbers and impact to major bullets.",
            "Move the most relevant projects and skills higher.",
            "Tailor keywords to the role before each application.",
          ],
    rewrittenSummary:
      rewrittenSummary ||
      `Role-focused candidate targeting ${roleLabel} with hands-on experience across ${stackLabel}. Brings practical project exposure, solid technical foundations, and clear potential to contribute in a results-driven team.`,
  };
};

const sendGeminiPartsRequest = async (parts) => {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parts,
      generationMode: "resume_analysis",
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Failed to analyze the resume.");
  }

  return String(data?.text || "");
};

const MAX_EXTRACTED_TEXT_LENGTH = 6000;

const fileToBase64 = async (file) => {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
};

const truncateExtractedText = (value = "") =>
  String(value || "").replace(/\s+/g, " ").trim().slice(0, MAX_EXTRACTED_TEXT_LENGTH);

export default function ResumeAnalyzerSection({
  compact = false,
  title = "AI Resume Analyzer",
  subtitle = "Upload your resume, target a role, and get an ATS-style score with practical improvements.",
}) {
  const [targetRole, setTargetRole] = useState("");
  const [targetStack, setTargetStack] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeMeta, setResumeMeta] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState(buildEmptyReport());

  const scoreTone = useMemo(() => {
    if (report.atsScore >= 80) return "text-emerald-700 border-emerald-200 bg-emerald-50";
    if (report.atsScore >= 60) return "text-amber-700 border-amber-200 bg-amber-50";
    return "text-rose-700 border-rose-200 bg-rose-50";
  }, [report.atsScore]);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  const handleRoleSuggestion = (role) => {
    setTargetRole(role);
    if (TECH_STACK_SUGGESTIONS[role] && !targetStack.trim()) {
      setTargetStack(TECH_STACK_SUGGESTIONS[role]);
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setUploadedFile(file);
      setResumeFileName(file.name);
      setResumeMeta(`${formatFileSize(file.size)} - ${file.type || "file"}`);

      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
        setPdfPreviewUrl("");
      }

      if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
        setPdfPreviewUrl(URL.createObjectURL(file));
        setResumeText("");
        toast.success("PDF uploaded successfully.");
        toast.info("Click View Resume to preview it. Analysis will use the uploaded PDF file.");
        return;
      }

      const readableText = await extractReadableText(file);
      const normalizedText = truncateExtractedText(readableText);
      setResumeText(normalizedText);
      if (!normalizedText || normalizedText.length < 80) {
        toast.warning("Resume text looks incomplete.", {
          description: "Try a cleaner TXT, MD, DOC, or DOCX resume for more accurate ATS analysis.",
        });
      } else {
        toast.success("Resume uploaded successfully.");
      }
    } catch (error) {
      console.error("Resume analyzer upload error:", error);
      toast.error("Could not read this file.", {
        description: "Try a text-based resume such as TXT, MD, DOC, or DOCX.",
      });
    }
  };

  const analyzeResume = async () => {
    if (!uploadedFile) {
      toast.error("Please upload your resume first.");
      return;
    }

    setLoading(true);

    try {
      const prompt = `ATS resume review.
Role: ${targetRole || "General professional role"}
Target skills: ${targetStack || "General hiring context"}
Resume text: ${resumeText || "No extracted text provided"}

Use attached file if present. Give a practical role-specific ATS + recruiter review. Reward clarity, impact, keywords, metrics, and alignment. Penalize vagueness, weak structure, missing metrics, and poor fit.

Return JSON only:
{
  "atsScore": number,
  "overallVerdict": "short verdict",
  "summary": "2-4 sentence personalized review",
  "strengths": ["item 1", "item 2", "item 3"],
  "issues": ["item 1", "item 2", "item 3"],
  "keywordGaps": ["missing keyword 1", "missing keyword 2"],
  "sectionFeedback": [
    { "section": "Professional Summary", "feedback": "specific feedback" },
    { "section": "Experience", "feedback": "specific feedback" },
    { "section": "Projects", "feedback": "specific feedback" },
    { "section": "Skills", "feedback": "specific feedback" }
  ],
  "actionPlan": ["action 1", "action 2", "action 3", "action 4"],
  "rewrittenSummary": "improved professional summary"
}
Keep all text concise.`;

      const parts = [{ text: prompt }];

      if (uploadedFile) {
        parts.push({
          inlineData: {
            mimeType: uploadedFile.type || "application/octet-stream",
            data: await fileToBase64(uploadedFile),
          },
        });
      }

      const response = await sendGeminiPartsRequest(parts);
      const parsed = extractJsonFromText(response);

      setReport(
        buildFallbackResumeReport(parsed, {
          targetRole,
          targetStack,
          resumeFileName,
        })
      );
      setReportOpen(true);
      toast.success("Resume report generated.");
    } catch (error) {
      console.error("Resume analyzer error:", error);
      toast.error("Failed to analyze the resume.", {
        description: error?.message || "Please try again in a moment.",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadResumeReport = () => {
    const bytes = buildResumeReportPdf({
      report,
      targetRole,
      targetStack,
      resumeFileName,
    });
    downloadPdfFile(
      `${(targetRole || "resume").replace(/\s+/g, "-").toLowerCase()}-ats-report.pdf`,
      bytes
    );
  };

  return (
    <>
      <section className={`rounded-[32px] border border-slate-200 bg-white shadow-sm ${compact ? "p-5" : "p-6 md:p-8"}`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              <FileSearch className="h-4 w-4" />
              Resume Intelligence
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              {title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
              {subtitle}
            </p>
          </div>
          <div className={`rounded-3xl border px-5 py-4 ${scoreTone}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">Latest ATS Score</p>
            <p className="mt-2 text-3xl font-semibold">{report.atsScore || "--"}</p>
            <p className="mt-1 text-sm">{report.overallVerdict || "Analyze a resume to see your report."}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fafc_100%)] p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Target Resume</h3>
                <p className="text-sm text-slate-500">Make the report more personalized by targeting a role or department.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Target role</label>
                <Input
                  value={targetRole}
                  onChange={(event) => setTargetRole(event.target.value)}
                  placeholder="Ex. Business Analyst, Mechanical Engineer, Sales Executive"
                  list="resume-analysis-roles"
                  className="mt-2"
                />
                <datalist id="resume-analysis-roles">
                  {JOB_ROLE_SUGGESTIONS.map((role) => (
                    <option key={role} value={role} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Target skills / stack / department</label>
                <textarea
                  value={targetStack}
                  onChange={(event) => setTargetStack(event.target.value)}
                  placeholder="Ex. SQL, Excel, BRD, stakeholder management or RCC design, AutoCAD, site execution"
                  className="mt-2 min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {JOB_ROLE_SUGGESTIONS.slice(0, 12).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleSuggestion(role)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fafc_100%)] p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Upload Resume</h3>
                <p className="text-sm text-slate-500">Upload a resume file to generate your ATS analysis.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <div>
                <Input type="file" accept=".txt,.md,.pdf,.doc,.docx" onChange={handleResumeUpload} />
                <p className="mt-2 text-xs text-slate-500">
                  Upload a resume file. TXT, MD, DOC, and DOCX files work best for direct ATS analysis.
                </p>
                {resumeFileName && (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{resumeFileName}</p>
                      <p className="mt-1 text-xs text-slate-500">{resumeMeta}</p>
                    </div>
                    {pdfPreviewUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0 rounded-2xl border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                        onClick={() => setPreviewOpen(true)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Resume
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <Button onClick={analyzeResume} disabled={loading} className="h-12 rounded-2xl text-sm font-semibold">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Analyze Resume
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-[30px] border border-slate-200 bg-white p-0">
          <DialogHeader className="border-b border-slate-100 p-6 md:p-8">
            <DialogTitle className="flex items-center gap-3 text-2xl font-semibold text-slate-900">
              <BadgeCheck className="h-6 w-6 text-indigo-600" />
              ATS Resume Report
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-7 text-slate-600">
              Personalized resume analysis with ATS alignment, recruiter-readability review, and action steps to improve shortlist chances.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 p-5 md:p-6">
            <div className="grid gap-4 md:grid-cols-[280px_1fr]">
              <div className={`rounded-[28px] border p-5 ${scoreTone}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.22em]">ATS Score</p>
                <p className="mt-3 text-5xl font-semibold">{report.atsScore}</p>
                <p className="mt-3 text-sm font-medium">{report.overallVerdict}</p>
              </div>
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Executive Summary</p>
                <p className="mt-3 text-sm leading-7 text-slate-700">{report.summary}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-semibold text-emerald-800">What is already working</p>
                <div className="mt-3 space-y-2">
                  {report.strengths.map((item) => (
                    <div key={item} className="rounded-2xl bg-white/70 p-3 text-sm text-emerald-950">{item}</div>
                  ))}
                </div>
              </div>
              <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-5">
                <p className="text-sm font-semibold text-rose-800">What needs improvement</p>
                <div className="mt-3 space-y-2">
                  {report.issues.map((item) => (
                    <div key={item} className="rounded-2xl bg-white/70 p-3 text-sm text-rose-950">{item}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-900">Keyword and ATS gaps</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {report.keywordGaps.map((item) => (
                  <span key={item} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">Section-by-section review</p>
                <div className="mt-3 space-y-3">
                  {report.sectionFeedback.map((item, index) => (
                    <div key={`${item.section}-${index}`} className="rounded-2xl bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{item.section}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{item.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">Priority action plan</p>
                <div className="mt-3 space-y-3">
                  {report.actionPlan.map((item, index) => (
                    <div key={`${item}-${index}`} className="flex items-start gap-3 rounded-2xl bg-white p-4 text-sm text-slate-700">
                      <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">
                        {index + 1}
                      </span>
                      <span className="leading-6">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-indigo-200 bg-[linear-gradient(145deg,#eef2ff_0%,#ffffff_100%)] p-5">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-indigo-600" />
                <p className="text-sm font-semibold text-slate-900">Suggested professional summary</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-700">{report.rewrittenSummary}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={downloadResumeReport} className="rounded-2xl">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button onClick={() => setReportOpen(false)} className="rounded-2xl">
                Close Report
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto rounded-[30px] border border-slate-200 bg-white p-0">
          <DialogHeader className="border-b border-slate-100 p-6">
            <DialogTitle className="flex items-center gap-3 text-2xl font-semibold text-slate-900">
              <FileText className="h-6 w-6 text-indigo-600" />
              Resume Preview
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-7 text-slate-600">
              {resumeFileName || "Uploaded resume"}
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 md:p-6">
            {pdfPreviewUrl ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <iframe
                  src={pdfPreviewUrl}
                  title="Resume PDF Preview"
                  className="h-[70vh] w-full"
                />
              </div>
            ) : (
              <p className="text-sm text-slate-600">No PDF preview is available for this file.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
