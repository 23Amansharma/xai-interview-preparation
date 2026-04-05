import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/utils/db";
import { MockInterview, UserAnswer } from "@/utils/schema";
import { requireAuthenticatedUser } from "@/lib/auth";
import { formatLegacyInterviewDate } from "@/utils/date";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const [userAnswers, interviews] = await Promise.all([
      db
        .select()
        .from(UserAnswer)
        .where(eq(UserAnswer.userEmail, user.email)),
      db
        .select()
        .from(MockInterview)
        .where(eq(MockInterview.createdBy, user.email))
        .orderBy(desc(MockInterview.id)),
    ]);

    return NextResponse.json({
      user: {
        email: user.email,
        fullName: user.fullName,
      },
      userAnswers,
      interviews,
    });
  } catch (error) {
    console.error("Interview dashboard fetch error:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch dashboard data.",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      jobPosition = "",
      jobDescription = "",
      jobExperience = "",
      resumeText = "",
      resumeFileName = "",
    } = body || {};

    if (!jobPosition.trim() || !jobDescription.trim() || !String(jobExperience).trim()) {
      return NextResponse.json(
        { message: "Job position, description, and experience are required." },
        { status: 400 }
      );
    }

    const interviewPayload = {
      questions: [],
      resumeText: String(resumeText || "").trim(),
      resumeFileName: String(resumeFileName || "").trim(),
    };

    const createdRows = await db
      .insert(MockInterview)
      .values({
        mockId: uuidv4(),
        jsonMockResp: JSON.stringify(interviewPayload),
        jobPosition: jobPosition.trim(),
        jobDesc: jobDescription.trim(),
        jobExperience: String(jobExperience).trim(),
        createdBy: user.email,
        createdAt: formatLegacyInterviewDate(),
      })
      .returning();

    return NextResponse.json({ interview: createdRows[0] }, { status: 201 });
  } catch (error) {
    console.error("Interview creation error:", error);
    return NextResponse.json(
      {
        message: "Failed to create interview.",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
