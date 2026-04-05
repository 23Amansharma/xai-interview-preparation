import "server-only";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const preferredModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const fallbackModels = [
  preferredModel,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
];
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const GEMINI_TIMEOUT_MS = 18000;
const MAX_TRANSIENT_RETRIES = 1;

const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 2048,
  responseMimeType: "text/plain",
};

const safetySettings=[
  {
      category:HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold:HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
      category:HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold:HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
      category:HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold:HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
      category:HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold:HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  }
];

export class GeminiServiceError extends Error {
  constructor(message, code = "GEMINI_UNKNOWN", status = 500) {
    super(message);
    this.name = "GeminiServiceError";
    this.code = code;
    this.status = status;
  }
}

const withTimeout = (promise, timeoutMs, message) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new GeminiServiceError(message, "GEMINI_TIMEOUT", 504));
      }, timeoutMs);
    }),
  ]);

const isMissingModelError = (message = "") =>
  message.includes("is not found for API version") ||
  message.includes("is not supported for generateContent");

const isTransientGeminiError = (message = "") => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("deadline exceeded") ||
    normalized.includes("timed out") ||
    normalized.includes("timeout") ||
    normalized.includes("unavailable") ||
    normalized.includes("internal error") ||
    normalized.includes("503") ||
    normalized.includes("500")
  );
};

const normalizeGeminiError = (error) => {
  if (error instanceof GeminiServiceError) {
    return error;
  }

  const message = String(error?.message || "");
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("quota") ||
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("429") ||
    normalizedMessage.includes("resource_exhausted")
  ) {
    return new GeminiServiceError(
      "Gemini quota was reached. Please retry in a moment.",
      "GEMINI_QUOTA",
      429
    );
  }

  if (normalizedMessage.includes("api key") || normalizedMessage.includes("permission")) {
    return new GeminiServiceError(
      "Gemini configuration is invalid or access is not permitted.",
      "GEMINI_CONFIG",
      500
    );
  }

  if (isMissingModelError(message)) {
    return new GeminiServiceError(
      "The configured Gemini model is not available for this request.",
      "GEMINI_UNSUPPORTED_MODEL",
      400
    );
  }

  if (isTransientGeminiError(message)) {
    return new GeminiServiceError(
      "Gemini took too long to respond. Please retry.",
      "GEMINI_TIMEOUT",
      504
    );
  }

  return new GeminiServiceError(
    message || "Gemini is unavailable right now.",
    "GEMINI_UNAVAILABLE",
    502
  );
};

export async function sendPartsToGemini(parts, options = {}) {
  if (!genAI) {
    throw new GeminiServiceError(
      "Missing Gemini API key. Add GEMINI_API_KEY to your server environment."
    );
  }

  const generationConfig = {
    ...DEFAULT_GENERATION_CONFIG,
    ...(options?.generationConfig || {}),
  };

  const modelsToTry = [...new Set(fallbackModels.filter(Boolean))];
  let lastError = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 0; attempt <= MAX_TRANSIENT_RETRIES; attempt += 1) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await withTimeout(
          model.generateContent({
            contents: [{ role: "user", parts }],
            generationConfig,
            safetySettings,
          }),
          GEMINI_TIMEOUT_MS,
          "Gemini took too long to respond. Please retry."
        );

        return result.response.text();
      } catch (error) {
        const errorMessage = String(error?.message || "");
        if (isMissingModelError(errorMessage)) {
          lastError = normalizeGeminiError(error);
          break;
        }

        const normalizedError = normalizeGeminiError(error);
        lastError = normalizedError;

        if (
          attempt < MAX_TRANSIENT_RETRIES &&
          (normalizedError.code === "GEMINI_TIMEOUT" ||
            normalizedError.code === "GEMINI_UNAVAILABLE")
        ) {
          continue;
        }

        throw normalizedError;
      }
    }
  }

  throw lastError || new GeminiServiceError("Unable to reach a supported Gemini model.");
}

export async function sendMessageToGemini(prompt, options = {}) {
  return sendPartsToGemini([{ text: prompt }], options);
}
