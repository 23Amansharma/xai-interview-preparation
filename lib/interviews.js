import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/utils/db";
import { MockInterview, UserAnswer } from "@/utils/schema";

export const getOwnedInterviewByMockId = async (mockId, ownerEmail) => {
  if (!mockId || !ownerEmail) {
    return null;
  }

  const interviews = await db
    .select()
    .from(MockInterview)
    .where(
      and(eq(MockInterview.mockId, mockId), eq(MockInterview.createdBy, ownerEmail))
    )
    .limit(1);

  return interviews[0] || null;
};

export const getOwnedAnswersByMockId = async (mockId, ownerEmail) => {
  if (!mockId || !ownerEmail) {
    return [];
  }

  return db
    .select()
    .from(UserAnswer)
    .where(
      and(eq(UserAnswer.mockIdRef, mockId), eq(UserAnswer.userEmail, ownerEmail))
    )
    .orderBy(UserAnswer.id);
};
