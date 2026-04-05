import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/utils/db";
import { MockInterview, UserAnswer } from "@/utils/schema";
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

    return NextResponse.json({ interview });
  } catch (error) {
    console.error("Interview fetch error:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch interview.",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
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
    const updates = {};

    if (typeof body?.jsonMockResp === "string") {
      updates.jsonMockResp = body.jsonMockResp;
    }

    if (typeof body?.jobPosition === "string") {
      updates.jobPosition = body.jobPosition;
    }

    if (typeof body?.jobDesc === "string") {
      updates.jobDesc = body.jobDesc;
    }

    if (typeof body?.jobExperience === "string") {
      updates.jobExperience = body.jobExperience;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: "No updates provided." }, { status: 400 });
    }

    const updatedRows = await db
      .update(MockInterview)
      .set(updates)
      .where(eq(MockInterview.id, interview.id))
      .returning();

    return NextResponse.json({ interview: updatedRows[0] });
  } catch (error) {
    console.error("Interview update error:", error);
    return NextResponse.json(
      {
        message: "Failed to update interview.",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const interview = await getOwnedInterviewByMockId(params?.interviewId, user.email);

    if (!interview) {
      return NextResponse.json({ message: "Interview not found." }, { status: 404 });
    }

    await db.delete(UserAnswer).where(eq(UserAnswer.mockIdRef, interview.mockId));
    await db.delete(MockInterview).where(eq(MockInterview.id, interview.id));

    return NextResponse.json({ status: "deleted" });
  } catch (error) {
    console.error("Interview delete error:", error);
    return NextResponse.json(
      {
        message: "Failed to delete interview.",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
