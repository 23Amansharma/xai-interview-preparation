const stripCodeFences = (text = "") => text.replace(/```json\s*|```/gi, "").trim();

const findBalancedJsonSnippet = (text = "", openingChar, closingChar) => {
  let startIndex = -1;
  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (startIndex === -1) {
      if (char === openingChar) {
        startIndex = index;
        depth = 1;
      }
      continue;
    }

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (char === "\\") {
        isEscaped = true;
        continue;
      }

      if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === openingChar) {
      depth += 1;
      continue;
    }

    if (char === closingChar) {
      depth -= 1;
      if (depth === 0) {
        return text.slice(startIndex, index + 1);
      }
    }
  }

  return "";
};

export function extractJsonFromText(text) {
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  const cleanedText = stripCodeFences(text);

  try {
    return JSON.parse(cleanedText);
  } catch (_error) {
    const objectSnippet = findBalancedJsonSnippet(cleanedText, "{", "}");
    if (objectSnippet) {
      return JSON.parse(objectSnippet);
    }

    const arraySnippet = findBalancedJsonSnippet(cleanedText, "[", "]");
    if (arraySnippet) {
      return JSON.parse(arraySnippet);
    }
  }

  throw new Error("Gemini returned a response that was not valid JSON.");
}
