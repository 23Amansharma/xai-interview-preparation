import { formatInterviewDate } from "./interview-analytics";

const getToneColor = (tone) => {
  switch (tone) {
    case "success":
      return "#047857";
    case "warning":
      return "#b45309";
    case "danger":
      return "#b91c1c";
    default:
      return "#334155";
  }
};

export const buildInterviewReportEmail = ({
  recipientName,
  recipientEmail,
  report,
}) => {
  const readinessColor = getToneColor(report?.readiness?.tone);
  const interview = report?.interview || {};
  const averageRating = report?.averageRating ? `${report.averageRating}/10` : "N/A";
  const deliverySignals = report?.overallInsights?.deliverySignals || {};
  const proctoringSummary = report?.overallInsights?.proctoringSummary || {};
  const strengths = report?.overallInsights?.topStrengths || [];
  const improvements = report?.overallInsights?.topImprovementAreas || [];
  const suggestions = report?.overallInsights?.futureSuggestions || [];
  const questionHighlights = (report?.feedbackList || []).slice(0, 4);
  const interviewDate = formatInterviewDate(interview?.createdAt);

  const subject = `Interview report: ${interview?.jobPosition || "AI Mock Interview"} on ${interviewDate}`;

  const html = `
  <div style="margin:0;padding:32px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:28px;overflow:hidden;">
      <div style="padding:32px;background:linear-gradient(135deg,#eff6ff 0%,#ffffff 42%,#f8fafc 100%);border-bottom:1px solid #e2e8f0;">
        <p style="margin:0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;font-weight:700;">Intivolution AI Report</p>
        <h1 style="margin:14px 0 8px;font-size:30px;line-height:1.2;color:#0f172a;">Your interview summary is ready</h1>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#475569;">
          Hi ${recipientName || recipientEmail || "Candidate"}, here is your latest performance report for the
          <strong>${interview?.jobPosition || "mock interview"}</strong> session.
        </p>
        <p style="margin:10px 0 0;font-size:13px;line-height:1.6;color:#64748b;">
          A concise PDF version of this report is attached for future reference.
        </p>
      </div>

      <div style="padding:28px 32px;">
        <div style="border:1px solid #e2e8f0;border-radius:22px;padding:22px;background:#ffffff;">
          <p style="margin:0;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#64748b;font-weight:700;">Readiness</p>
          <h2 style="margin:12px 0 8px;font-size:24px;color:${readinessColor};">${report?.readiness?.label || "Session Summary"}</h2>
          <p style="margin:0;color:#475569;line-height:1.7;">${report?.readiness?.description || "Keep practicing to unlock stronger interview performance."}</p>
        </div>

        <div style="margin-top:22px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;">
          ${[
            { label: "Average Score", value: averageRating },
            { label: "Questions Evaluated", value: String(report?.totalQuestions || 0) },
            { label: "Confidence", value: deliverySignals.confidenceScore ? `${deliverySignals.confidenceScore}/10` : "N/A" },
            { label: "Focus", value: deliverySignals.focusScore ? `${deliverySignals.focusScore}/10` : "N/A" },
          ]
            .map(
              (item) => `
            <div style="border:1px solid #e2e8f0;border-radius:18px;padding:18px;background:#f8fafc;">
              <p style="margin:0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;font-weight:700;">${item.label}</p>
              <p style="margin:10px 0 0;font-size:26px;font-weight:700;color:#0f172a;">${item.value}</p>
            </div>`
            )
            .join("")}
        </div>

        <div style="margin-top:24px;border:1px solid #e2e8f0;border-radius:22px;padding:22px;background:#ffffff;">
          <h3 style="margin:0 0 12px;font-size:18px;color:#0f172a;">Session context</h3>
          <p style="margin:0;color:#475569;line-height:1.8;">
            <strong>Role:</strong> ${interview?.jobPosition || "Interview Session"}<br />
            <strong>Experience level:</strong> ${interview?.jobExperience || "N/A"}<br />
            <strong>Date:</strong> ${interviewDate}<br />
            <strong>Tech stack:</strong> ${interview?.jobDesc || "Not specified"}
          </p>
        </div>

        <div style="margin-top:24px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;">
          <div style="border:1px solid #bbf7d0;border-radius:22px;padding:22px;background:#f0fdf4;">
            <h3 style="margin:0 0 14px;font-size:18px;color:#166534;">What went well</h3>
            ${strengths.length > 0
              ? strengths
                  .map((item) => `<div style="margin-top:10px;padding:12px 14px;border-radius:16px;background:#ffffff;color:#166534;line-height:1.6;">${item}</div>`)
                  .join("")
              : `<p style="margin:0;color:#166534;">More completed answers will reveal repeat strengths.</p>`}
          </div>
          <div style="border:1px solid #fde68a;border-radius:22px;padding:22px;background:#fffbeb;">
            <h3 style="margin:0 0 14px;font-size:18px;color:#92400e;">Improve next</h3>
            ${improvements.length > 0
              ? improvements
                  .map((item) => `<div style="margin-top:10px;padding:12px 14px;border-radius:16px;background:#ffffff;color:#92400e;line-height:1.6;">${item}</div>`)
                  .join("")
              : `<p style="margin:0;color:#92400e;">No repeat improvement themes have been detected yet.</p>`}
          </div>
        </div>

        <div style="margin-top:24px;border:1px solid #dbeafe;border-radius:22px;padding:22px;background:#f8fbff;">
          <h3 style="margin:0 0 14px;font-size:18px;color:#1d4ed8;">Suggested next steps</h3>
          ${suggestions.length > 0
            ? suggestions
                .map((item) => `<div style="margin-top:10px;padding:12px 14px;border-radius:16px;background:#ffffff;color:#1e3a8a;line-height:1.6;">${item}</div>`)
                .join("")
            : `<p style="margin:0;color:#1e3a8a;">Keep practicing role-specific answers to unlock future coaching suggestions.</p>`}
        </div>

        <div style="margin-top:24px;border:1px solid #e2e8f0;border-radius:22px;padding:22px;background:#ffffff;">
          <h3 style="margin:0 0 14px;font-size:18px;color:#0f172a;">Question highlights</h3>
          ${questionHighlights.length > 0
            ? questionHighlights
                .map(
                  (item) => `
                <div style="margin-top:14px;padding:16px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;">
                  <p style="margin:0;font-weight:700;color:#0f172a;">${item.question}</p>
                  <p style="margin:10px 0 0;color:#475569;line-height:1.7;">${item.feedbackDetails?.feedback || "No summary available."}</p>
                  <p style="margin:10px 0 0;font-size:13px;color:#64748b;">Rating: ${item.rating || "N/A"}/10</p>
                </div>
              `
                )
                .join("")
            : `<p style="margin:0;color:#475569;">Detailed question-level highlights were not available for this session.</p>`}
        </div>

        <div style="margin-top:24px;border:1px solid #e2e8f0;border-radius:22px;padding:22px;background:#ffffff;">
          <h3 style="margin:0 0 14px;font-size:18px;color:#0f172a;">Monitoring summary</h3>
          <p style="margin:0;color:#475569;line-height:1.8;">
            Warnings: ${proctoringSummary.warningsCount || 0},
            Hidden tabs: ${proctoringSummary.hiddenTabEvents || 0},
            No-face checks: ${proctoringSummary.noFaceEvents || 0},
            Multiple-face checks: ${proctoringSummary.multipleFaceEvents || 0},
            Off-center checks: ${proctoringSummary.offCenterEvents || 0}
          </p>
        </div>
      </div>
    </div>
  </div>`;

  const text = [
    `Interview report for ${interview?.jobPosition || "mock interview"} (${interviewDate})`,
    ``,
    `Readiness: ${report?.readiness?.label || "Session Summary"}`,
    `${report?.readiness?.description || ""}`,
    ``,
    `Average score: ${averageRating}`,
    `Questions evaluated: ${report?.totalQuestions || 0}`,
    `Confidence: ${deliverySignals.confidenceScore ? `${deliverySignals.confidenceScore}/10` : "N/A"}`,
    `Focus: ${deliverySignals.focusScore ? `${deliverySignals.focusScore}/10` : "N/A"}`,
    ``,
    `Top strengths:`,
    ...(strengths.length > 0 ? strengths.map((item) => `- ${item}`) : ["- More data needed"]),
    ``,
    `Top improvement areas:`,
    ...(improvements.length > 0 ? improvements.map((item) => `- ${item}`) : ["- No recurring themes yet"]),
    ``,
    `Next steps:`,
    ...(suggestions.length > 0 ? suggestions.map((item) => `- ${item}`) : ["- Keep practicing role-specific answers"]),
  ].join("\n");

  return {
    subject,
    html,
    text,
  };
};
