import { NextResponse } from "next/server";
import { buildInterviewReport } from "@/utils/interview-analytics";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getOwnedAnswersByMockId, getOwnedInterviewByMockId } from "@/lib/interviews";

export async function GET(_request, { params }) {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const interview = await getOwnedInterviewByMockId(params?.interviewId, user.email);

    if (!interview) {
      return NextResponse.json({ message: "Interview not found." }, { status: 404 });
    }

    const answers = await getOwnedAnswersByMockId(interview.mockId, user.email);
    const report = buildInterviewReport(answers, interview);

    return NextResponse.json({
      interview,
      answers,
      report,
    });
  } catch (error) {
    console.error("Feedback fetch error:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch interview feedback.",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
