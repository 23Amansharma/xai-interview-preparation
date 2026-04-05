import { NextResponse } from "next/server";
import { sendMessageToGemini } from "@/utils/GeminiAIModal";
import { requireAuthenticatedUser } from "@/lib/auth";

export async function POST(request) {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const {
      mode = "coach",
      userName = "Candidate",
      question = "",
      selectedRole = "General interview preparation",
      selectedStack = "",
      selectedExperience = "",
      topImprovementAreas = [],
      recentStrengths = [],
      conversation = [],
    } = await request.json();

    if (!String(question).trim()) {
      return NextResponse.json({ message: "Question is required." }, { status: 400 });
    }

    const recentConversation = Array.isArray(conversation)
      ? conversation.slice(-6).map((entry) => ({
          role: entry?.role === "assistant" ? "assistant" : "user",
          content: String(entry?.content || "").trim(),
        }))
      : [];

    const modeInstructions = {
      coach: "Answer the exact prep question with role-specific practical advice.",
      revision_plan: "Return a short revision plan with priorities, 30-min sprint, 1-hour practice, and final self-check.",
      quiz: "Return 1 question, strong-answer points, 1 follow-up, and 1 red flag.",
    };

    const prompt = `Interview prep coach.
Name: ${userName}
Role: ${selectedRole}
Stack: ${selectedStack || "Not specified"}
Experience: ${selectedExperience || "Not specified"}
Strengths: ${JSON.stringify(recentStrengths)}
Improve: ${JSON.stringify(topImprovementAreas)}
Context: ${JSON.stringify(recentConversation)}
Question: ${question}
Mode: ${mode}

Rules:
- Answer only interview-prep queries.
- Personalize to role, stack, strengths, and gaps.
- Be concise, practical, and plain text.
- ${modeInstructions[mode] || modeInstructions.coach}
- If broad, cover: what to know, what interviewer expects, how to answer, quick practice.
- Keep under 250 words.`;

    const response = await sendMessageToGemini(prompt);

    return NextResponse.json({
      reply: response,
    });
  } catch (error) {
    console.error("Dashboard prep chat error:", error);
    return NextResponse.json(
      {
        message: "Unable to generate the prep coach response.",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
