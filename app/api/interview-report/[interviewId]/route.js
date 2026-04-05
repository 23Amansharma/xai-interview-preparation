import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/utils/db";
import { MockInterview, UserAnswer } from "@/utils/schema";
import { buildInterviewReport, parseInterviewPayload } from "@/utils/interview-analytics";
import { buildInterviewReportEmail } from "@/utils/interview-report-email";
import { buildInterviewReportPdf } from "@/utils/report-pdf";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getOwnedInterviewByMockId } from "@/lib/interviews";

const updateInterviewEmailStatus = async (interview, status, sentAt = "") => {
  const parsedPayload = parseInterviewPayload(interview?.jsonMockResp);
  const nextPayload = {
    ...parsedPayload,
    reportEmailStatus: status,
    reportEmailSentAt: sentAt,
  };

  await db
    .update(MockInterview)
    .set({ jsonMockResp: JSON.stringify(nextPayload) })
    .where(eq(MockInterview.mockId, interview.mockId));
};

const sendWithResend = async ({ to, subject, html, text, attachments = [] }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REPORT_FROM_EMAIL || process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("Missing RESEND_API_KEY or REPORT_FROM_EMAIL.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
      attachments,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend API error: ${errorBody}`);
  }

  return response.json();
};

const getFriendlyEmailErrorMessage = (error) => {
  const rawMessage = error?.message || "Unknown error";

  if (
    rawMessage.includes("validation_error") &&
    rawMessage.includes("You can only send testing emails to your own email address")
  ) {
    return "Resend is still in testing mode. Verify your sending domain in Resend and use that verified domain in REPORT_FROM_EMAIL before sending reports to each signed-in user's email address.";
  }

  return rawMessage;
};

export async function POST(request, { params }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { recipientName = "", force = false } = body || {};
    const interviewId = params?.interviewId;
    const user = await requireAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!interviewId) {
      return NextResponse.json({ message: "Interview id is required." }, { status: 400 });
    }

    const interview = await getOwnedInterviewByMockId(interviewId, user.email);

    if (!interview) {
      return NextResponse.json({ message: "Interview not found." }, { status: 404 });
    }

    const parsedPayload = parseInterviewPayload(interview.jsonMockResp);
    if (parsedPayload.reportEmailSentAt && !force) {
      return NextResponse.json({
        status: "already_sent",
        sentAt: parsedPayload.reportEmailSentAt,
      });
    }

    const resolvedEmail = user.email || interview.createdBy;
    if (!resolvedEmail) {
      return NextResponse.json({ message: "Recipient email is required." }, { status: 400 });
    }

    const answers = await db
      .select()
      .from(UserAnswer)
      .where(and(eq(UserAnswer.mockIdRef, interviewId), eq(UserAnswer.userEmail, resolvedEmail)));

    if (!answers.length) {
      return NextResponse.json({ message: "No interview answers were found for this report." }, { status: 400 });
    }

    const report = buildInterviewReport(answers, interview);
    const emailPayload = buildInterviewReportEmail({
      recipientName: recipientName || user.fullName,
      recipientEmail: resolvedEmail,
      report,
    });
    const pdfBytes = buildInterviewReportPdf(report);
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

    await sendWithResend({
      to: [resolvedEmail],
      ...emailPayload,
      attachments: [
        {
          filename: `${(interview?.jobPosition || "interview-report").replace(/\s+/g, "-").toLowerCase()}-report.pdf`,
          content: pdfBase64,
          contentType: "application/pdf",
        },
      ],
    });

    const sentAt = new Date().toISOString();
    await updateInterviewEmailStatus(interview, "sent", sentAt);

    return NextResponse.json({
      status: "sent",
      sentAt,
      averageRating: report.averageRating,
      totalQuestions: report.totalQuestions,
    });
  } catch (error) {
    console.error("Interview report send error:", error);

    const interviewId = params?.interviewId;
    const user = await requireAuthenticatedUser().catch(() => null);
    if (interviewId && user?.email) {
      const interviewRows = await db
        .select()
        .from(MockInterview)
        .where(and(eq(MockInterview.mockId, interviewId), eq(MockInterview.createdBy, user.email)))
        .catch(() => []);
      const interview = interviewRows?.[0];
      if (interview) {
        await updateInterviewEmailStatus(interview, "failed", "");
      }
    }

    return NextResponse.json(
      {
        message: "Failed to send the interview report email.",
        error: getFriendlyEmailErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
