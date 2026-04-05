import { NextResponse } from "next/server";
import { GeminiServiceError, sendMessageToGemini, sendPartsToGemini } from "@/utils/GeminiAIModal";
import { extractJsonFromText } from "@/utils/gemini-response";

const MAX_PROMPT_LENGTH = 24000;
const MAX_PARTS = 8;
const MAX_TEXT_PART_LENGTH = 24000;
const MAX_INLINE_DATA_LENGTH = 7_500_000;
const MAX_JSON_REPAIR_INPUT = 7000;

const normalizeText = (value) => String(value || "").trim();
const expectsJsonResponse = (generationMode = "") =>
  ["interview_question", "interview_feedback", "resume_analysis"].includes(generationMode);

const sanitizeJsonText = (text = "") => JSON.stringify(extractJsonFromText(text));

const repairJsonText = async (rawText, generationMode) => {
  const trimmedText = String(rawText || "").trim().slice(0, MAX_JSON_REPAIR_INPUT);
  const repairPrompt = `Fix this ${generationMode || "Gemini"} output into valid JSON only. Do not add explanation.\n\n${trimmedText}`;
  const repairedText = await sendMessageToGemini(repairPrompt, {
    generationConfig: {
      maxOutputTokens: 1800,
      temperature: 0,
      responseMimeType: "application/json",
    },
  });

  return sanitizeJsonText(repairedText);
};

const validateInlineData = (part) => {
  const mimeType = normalizeText(part?.inlineData?.mimeType);
  const data = normalizeText(part?.inlineData?.data);

  if (!mimeType || !data) {
    throw new GeminiServiceError("Invalid inline file data supplied.", "GEMINI_INVALID_INPUT", 400);
  }

  if (data.length > MAX_INLINE_DATA_LENGTH) {
    throw new GeminiServiceError(
      "Uploaded file is too large for Gemini processing. Please use a smaller resume file.",
      "GEMINI_FILE_TOO_LARGE",
      413
    );
  }

  return {
    inlineData: {
      mimeType,
      data,
    },
  };
};

const normalizeParts = (parts = []) => {
  if (!Array.isArray(parts) || !parts.length) {
    throw new GeminiServiceError("Gemini request is missing content.", "GEMINI_INVALID_INPUT", 400);
  }

  if (parts.length > MAX_PARTS) {
    throw new GeminiServiceError("Gemini request contains too many parts.", "GEMINI_REQUEST_TOO_LARGE", 413);
  }

  return parts.map((part) => {
    if (part?.inlineData) {
      return validateInlineData(part);
    }

    const text = normalizeText(part?.text);
    if (!text) {
      throw new GeminiServiceError("Gemini request contains an empty text part.", "GEMINI_INVALID_INPUT", 400);
    }

    if (text.length > MAX_TEXT_PART_LENGTH) {
      throw new GeminiServiceError(
        "Gemini request text is too long. Please shorten the content and retry.",
        "GEMINI_TEXT_TOO_LARGE",
        413
      );
    }

    return { text };
  });
};

export async function POST(request) {
  try {
    const body = await request.json();
    const prompt = normalizeText(body?.prompt);
    const parts = Array.isArray(body?.parts) ? body.parts : null;
    const generationMode = normalizeText(body?.generationMode);

    if (!prompt && !parts?.length) {
      return NextResponse.json({ message: "Prompt or parts are required." }, { status: 400 });
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { message: "Gemini request text is too long. Please shorten the prompt and retry." },
        { status: 413 }
      );
    }

    const generationOptions =
      generationMode === "interview_question"
        ? {
            generationConfig: {
              maxOutputTokens: 900,
              temperature: 0.8,
              responseMimeType: "application/json",
            },
          }
        : generationMode === "interview_feedback"
        ? {
            generationConfig: {
              maxOutputTokens: 1400,
              temperature: 0.4,
              responseMimeType: "application/json",
            },
          }
        : generationMode === "resume_analysis"
        ? {
            generationConfig: {
              maxOutputTokens: 1800,
              temperature: 0.3,
              responseMimeType: "application/json",
            },
          }
        : {};

    const rawText = prompt
      ? await sendMessageToGemini(prompt, generationOptions)
      : await sendPartsToGemini(normalizeParts(parts), generationOptions);

    let text = rawText;
    if (expectsJsonResponse(generationMode)) {
      try {
        text = sanitizeJsonText(rawText);
      } catch (jsonError) {
        console.error("Gemini returned invalid JSON, attempting repair:", jsonError);
        text = await repairJsonText(rawText, generationMode);
      }
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Gemini proxy route error:", error);
    const status = error instanceof GeminiServiceError ? error.status : 500;
    const message =
      error instanceof GeminiServiceError
        ? error.message
        : "Unable to process the Gemini request.";

    return NextResponse.json(
      {
        message,
        error: error?.message || "Unknown error",
        code: error?.code || "GEMINI_PROXY_ERROR",
      },
      { status }
    );
  }
}
