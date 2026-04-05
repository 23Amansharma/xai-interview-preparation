import { NextResponse } from "next/server";
import { db } from "@/utils/db";
import { UserAnswer } from "@/utils/schema";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getOwnedAnswersByMockId, getOwnedInterviewByMockId } from "@/lib/interviews";
import { formatLegacyInterviewDate } from "@/utils/date";

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

    return NextResponse.json({ answers });
  } catch (error) {
    console.error("Interview answers fetch error:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch interview answers.",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const interview = await getOwnedInterviewByMockId(params?.interviewId, user.email);

    if (!interview) {
      return NextResponse.json({ message: "Interview not found." }, { status: 404 });
    }

    const body = await request.json();
    const {
      question = "",
      correctAns = "",
      userAns = "",
      feedback = "",
      rating = "",
    } = body || {};

    if (!String(question).trim()) {
      return NextResponse.json({ message: "Question is required." }, { status: 400 });
    }

    const insertedRows = await db
      .insert(UserAnswer)
      .values({
        mockIdRef: interview.mockId,
        question: String(question),
        correctAns: String(correctAns || ""),
        userAns: String(userAns || ""),
        feedback: String(feedback || ""),
        rating: String(rating || ""),
        userEmail: user.email,
        createdAt: formatLegacyInterviewDate(),
      })
      .returning();

    return NextResponse.json({ answer: insertedRows[0] }, { status: 201 });
  } catch (error) {
    console.error("Interview answer save error:", error);
    return NextResponse.json(
      {
        message: "Failed to save interview answer.",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
