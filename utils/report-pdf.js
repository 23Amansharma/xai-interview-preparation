const PDF_PAGE_WIDTH = 595;
const PDF_PAGE_HEIGHT = 842;
const PDF_MARGIN_X = 44;
const PDF_MARGIN_TOP = 56;
const PDF_MARGIN_BOTTOM = 52;

const escapePdfText = (value = "") =>
  String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const wrapText = (text = "", maxChars = 92) => {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [""];
  }

  const words = normalized.split(" ");
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length <= maxChars) {
      currentLine = nextLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

const addWrappedText = (lines, text, options = {}) => {
  const {
    size = 10,
    leading = 14,
    bold = false,
    prefix = "",
    maxChars = 92,
  } = options;
  const wrapped = wrapText(text, maxChars);

  wrapped.forEach((line, index) => {
    lines.push({
      text: `${index === 0 ? prefix : prefix ? "  " : ""}${line}`,
      size,
      leading,
      bold,
    });
  });
};

const buildPdfFromLineSpecs = (lineSpecs = []) => {
  const pages = [];
  let currentPage = [];
  let y = PDF_PAGE_HEIGHT - PDF_MARGIN_TOP;

  lineSpecs.forEach((line) => {
    if (line.text === "__PAGE_BREAK__") {
      pages.push(currentPage);
      currentPage = [];
      y = PDF_PAGE_HEIGHT - PDF_MARGIN_TOP;
      return;
    }

    const leading = line.leading || 14;
    if (y - leading < PDF_MARGIN_BOTTOM) {
      pages.push(currentPage);
      currentPage = [];
      y = PDF_PAGE_HEIGHT - PDF_MARGIN_TOP;
    }

    currentPage.push({ ...line, y });
    y -= leading;
  });

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  const objects = [];
  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;
  objects[4] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`;

  const pageObjectIds = [];

  pages.forEach((pageLines, index) => {
    const contentObjectId = 5 + index * 2;
    const pageObjectId = 6 + index * 2;
    const stream = pageLines
      .map((line) => {
        const fontKey = line.bold ? "F2" : "F1";
        return `BT /${fontKey} ${line.size || 10} Tf 1 0 0 1 ${PDF_MARGIN_X} ${line.y} Tm (${escapePdfText(line.text)}) Tj ET`;
      })
      .join("\n");

    objects[contentObjectId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    objects[pageObjectId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_PAGE_WIDTH} ${PDF_PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectId} 0 R >>`;
    pageObjectIds.push(pageObjectId);
  });

  objects[2] = `<< /Type /Pages /Count ${pageObjectIds.length} /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let index = 1; index < objects.length; index += 1) {
    if (!objects[index]) {
      continue;
    }
    offsets[index] = pdf.length;
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index < objects.length; index += 1) {
    const offset = offsets[index] || 0;
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new TextEncoder().encode(pdf);
};

export const downloadPdfFile = (filename, bytes) => {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const buildResumeReportPdf = ({ report, targetRole = "", targetStack = "", resumeFileName = "" }) => {
  const lines = [];
  lines.push({ text: "Resume ATS Report", size: 18, leading: 24, bold: true });
  addWrappedText(lines, targetRole ? `Target role: ${targetRole}` : "Target role: General", { size: 10, leading: 14 });
  if (targetStack) {
    addWrappedText(lines, `Target context: ${targetStack}`, { size: 10, leading: 14 });
  }
  if (resumeFileName) {
    addWrappedText(lines, `Resume file: ${resumeFileName}`, { size: 10, leading: 14 });
  }
  lines.push({ text: "", size: 10, leading: 10 });

  addWrappedText(lines, `ATS score: ${report?.atsScore || 0}/100`, { size: 12, leading: 16, bold: true });
  addWrappedText(lines, report?.overallVerdict || "", { size: 10, leading: 14 });
  lines.push({ text: "", size: 10, leading: 8 });

  addWrappedText(lines, "Summary", { size: 12, leading: 16, bold: true });
  addWrappedText(lines, report?.summary || "", { size: 10, leading: 14 });

  addWrappedText(lines, "Strengths", { size: 12, leading: 16, bold: true });
  (report?.strengths || []).slice(0, 4).forEach((item) => addWrappedText(lines, item, { prefix: "- ", size: 10, leading: 14 }));

  addWrappedText(lines, "Needs improvement", { size: 12, leading: 16, bold: true });
  (report?.issues || []).slice(0, 4).forEach((item) => addWrappedText(lines, item, { prefix: "- ", size: 10, leading: 14 }));

  addWrappedText(lines, "Keyword gaps", { size: 12, leading: 16, bold: true });
  addWrappedText(lines, (report?.keywordGaps || []).slice(0, 8).join(", ") || "No major keyword gaps captured.", { size: 10, leading: 14 });

  addWrappedText(lines, "Action plan", { size: 12, leading: 16, bold: true });
  (report?.actionPlan || []).slice(0, 5).forEach((item, index) => addWrappedText(lines, `${index + 1}. ${item}`, { size: 10, leading: 14 }));

  if (report?.rewrittenSummary) {
    addWrappedText(lines, "Suggested summary", { size: 12, leading: 16, bold: true });
    addWrappedText(lines, report.rewrittenSummary, { size: 10, leading: 14 });
  }

  return buildPdfFromLineSpecs(lines);
};

export const buildSkillAssessmentPdf = ({
  assessmentTitle = "",
  assessmentSubtitle = "",
  score = 0,
  percentage = 0,
  answeredCount = 0,
  totalQuestions = 0,
  readinessLabel = "",
  readinessSummary = "",
  recommendations = [],
  missedConcepts = [],
}) => {
  const lines = [];
  lines.push({ text: "Skill Assessment Report", size: 18, leading: 24, bold: true });
  addWrappedText(lines, `Assessment: ${assessmentTitle || "Skill Assessment"}`, { size: 10, leading: 14 });
  if (assessmentSubtitle) {
    addWrappedText(lines, assessmentSubtitle, { size: 10, leading: 14 });
  }
  addWrappedText(lines, `Score: ${score}/${totalQuestions || 0} (${percentage}%)`, { size: 12, leading: 16, bold: true });
  addWrappedText(lines, `Answered: ${answeredCount}/${totalQuestions || 0}`, { size: 10, leading: 14 });
  addWrappedText(lines, `Readiness: ${readinessLabel || "In progress"}`, { size: 10, leading: 14 });
  lines.push({ text: "", size: 10, leading: 8 });

  addWrappedText(lines, "Summary", { size: 12, leading: 16, bold: true });
  addWrappedText(lines, readinessSummary || "Complete the assessment to unlock a concise readiness summary.", { size: 10, leading: 14 });

  addWrappedText(lines, "Priority improvements", { size: 12, leading: 16, bold: true });
  (recommendations || []).slice(0, 5).forEach((item, index) =>
    addWrappedText(lines, `${index + 1}. ${item}`, { size: 10, leading: 14 })
  );

  addWrappedText(lines, "Missed concepts", { size: 12, leading: 16, bold: true });
  addWrappedText(lines, (missedConcepts || []).join(", ") || "No major concept gaps captured.", { size: 10, leading: 14 });

  return buildPdfFromLineSpecs(lines);
};

export const buildInterviewReportPdf = (report) => {
  const lines = [];
  const interview = report?.interview || {};
  lines.push({ text: "Interview Performance Report", size: 18, leading: 24, bold: true });
  addWrappedText(lines, `Role: ${interview?.jobPosition || "Mock Interview"}`, { size: 10, leading: 14 });
  addWrappedText(lines, `Experience: ${interview?.jobExperience || "N/A"}`, { size: 10, leading: 14 });
  addWrappedText(lines, `Average score: ${report?.averageRating || "N/A"}/10`, { size: 10, leading: 14 });
  lines.push({ text: "", size: 10, leading: 8 });

  addWrappedText(lines, "Readiness", { size: 12, leading: 16, bold: true });
  addWrappedText(lines, `${report?.readiness?.label || "Session Summary"} - ${report?.readiness?.description || ""}`, { size: 10, leading: 14 });

  addWrappedText(lines, "Top strengths", { size: 12, leading: 16, bold: true });
  (report?.overallInsights?.topStrengths || []).slice(0, 4).forEach((item) => addWrappedText(lines, item, { prefix: "- ", size: 10, leading: 14 }));

  addWrappedText(lines, "Improve next", { size: 12, leading: 16, bold: true });
  (report?.overallInsights?.topImprovementAreas || []).slice(0, 4).forEach((item) => addWrappedText(lines, item, { prefix: "- ", size: 10, leading: 14 }));

  addWrappedText(lines, "Next steps", { size: 12, leading: 16, bold: true });
  (report?.overallInsights?.futureSuggestions || []).slice(0, 5).forEach((item, index) => addWrappedText(lines, `${index + 1}. ${item}`, { size: 10, leading: 14 }));

  addWrappedText(lines, "Monitoring summary", { size: 12, leading: 16, bold: true });
  const proctoring = report?.overallInsights?.proctoringSummary || {};
  addWrappedText(
    lines,
    `Warnings ${proctoring.warningsCount || 0}, hidden tabs ${proctoring.hiddenTabEvents || 0}, no-face ${proctoring.noFaceEvents || 0}, multiple-face ${proctoring.multipleFaceEvents || 0}, off-center ${proctoring.offCenterEvents || 0}.`,
    { size: 10, leading: 14 }
  );

  addWrappedText(lines, "Question highlights", { size: 12, leading: 16, bold: true });
  (report?.feedbackList || []).slice(0, 4).forEach((item, index) => {
    addWrappedText(lines, `${index + 1}. ${item.question}`, { size: 10, leading: 14, bold: true });
    addWrappedText(lines, item.feedbackDetails?.feedback || "No summary available.", { size: 10, leading: 14 });
  });

  return buildPdfFromLineSpecs(lines);
};
