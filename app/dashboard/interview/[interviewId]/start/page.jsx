"use client";
import React, { useEffect, useRef, useState } from "react";
import AdaptiveQuestionsSection from "./_components/AdaptiveQuestionsSection";
import RecordAnswerSection from "./_components/RecordAnswerSection";
import { Button } from "@/components/ui/button";
import { Loader2, Users, FileText, SquareTerminal } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { extractJsonFromText } from "@/utils/gemini-response";
import { useRouter } from "next/navigation";

const MAX_QUESTIONS = 12;
const MAX_PREVIOUS_QUESTIONS = 6;
const MAX_PREVIOUS_ANSWERS = 4;
const MAX_PROJECT_HINTS = 3;
const DEFAULT_THEORY_TIME_SECONDS = 45;
const CODING_TIME_BY_DIFFICULTY = {
  easy: 8 * 60,
  medium: 9 * 60,
  hard: 10 * 60,
};
const TECHNICAL_ROLE_PATTERN = /(software|developer|engineer|frontend|backend|full\s?stack|web|mobile|android|ios|react|next|node|javascript|typescript|java|python|c\+\+|c#|golang|devops|data|ml|ai|machine learning|sde|programmer)/i;
const CODING_QUESTION_PATTERN = /(write code|implement|coding|function|algorithm|solve|debug|fix this code|sql|query|program|time complexity|space complexity|leetcode|array|string|linked list|tree|stack|queue|hash map|endpoint)/i;
const SUPPORTED_CODING_LANGUAGES = ["javascript", "typescript", "python", "java", "cpp"];

const FOCUS_AREA_SEQUENCE = [
  "self-introduction",
  "project-overview",
  "role-strengths",
  "technology-choice",
  "problem-solving",
  "tradeoff-analysis",
  "ux-quality",
  "architecture-tradeoffs",
  "solution-uniqueness",
  "growth-reflection",
  "scalability",
  "technical-reflection",
];

const normalizeQuestionText = (text = "") =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "then", "than", "so", "of", "for",
  "to", "in", "on", "at", "by", "with", "from", "as", "is", "are", "was", "were",
  "be", "been", "being", "do", "did", "does", "have", "has", "had", "you", "your",
  "about", "into", "that", "this", "these", "those", "what", "which", "why", "how",
  "when", "where", "who", "whom", "tell", "describe", "explain", "role", "candidate",
]);

const tokenizeQuestion = (text = "") =>
  normalizeQuestionText(text)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

const buildBigrams = (tokens = []) => {
  const bigrams = [];
  for (let index = 0; index < tokens.length - 1; index += 1) {
    bigrams.push(`${tokens[index]} ${tokens[index + 1]}`);
  }
  return bigrams;
};

const sendGeminiPrompt = async (prompt) => {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      generationMode: "interview_question",
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Failed to generate the next interview question.");
  }

  return String(data?.text || "");
};

const jaccardSimilarity = (leftItems = [], rightItems = []) => {
  const leftSet = new Set(leftItems);
  const rightSet = new Set(rightItems);

  if (leftSet.size === 0 || rightSet.size === 0) {
    return 0;
  }

  let intersectionCount = 0;
  leftSet.forEach((item) => {
    if (rightSet.has(item)) {
      intersectionCount += 1;
    }
  });

  const unionCount = new Set([...leftSet, ...rightSet]).size;
  return unionCount ? intersectionCount / unionCount : 0;
};

const areQuestionsTooSimilar = (leftQuestion = "", rightQuestion = "") => {
  const normalizedLeft = normalizeQuestionText(leftQuestion);
  const normalizedRight = normalizeQuestionText(rightQuestion);

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  if (normalizedLeft === normalizedRight) {
    return true;
  }

  const leftTokens = tokenizeQuestion(leftQuestion);
  const rightTokens = tokenizeQuestion(rightQuestion);
  const tokenSimilarity = jaccardSimilarity(leftTokens, rightTokens);
  const bigramSimilarity = jaccardSimilarity(buildBigrams(leftTokens), buildBigrams(rightTokens));

  return tokenSimilarity >= 0.68 || bigramSimilarity >= 0.55;
};

const parseInterviewPayload = (rawPayload) => {
  try {
    const parsedPayload = JSON.parse(rawPayload || "[]");

    if (Array.isArray(parsedPayload)) {
      return {
        questions: parsedPayload,
        resumeText: "",
        resumeFileName: "",
      };
    }

    return {
      questions: Array.isArray(parsedPayload?.questions) ? parsedPayload.questions : [],
      resumeText: String(parsedPayload?.resumeText || ""),
      resumeFileName: String(parsedPayload?.resumeFileName || ""),
    };
  } catch (error) {
    console.error("Failed to parse interview payload:", error);
    return {
      questions: [],
      resumeText: "",
      resumeFileName: "",
    };
  }
};

const inferCodingLanguage = (interviewData = {}, explicitLanguage = "") => {
  const normalizedExplicit = String(explicitLanguage || "").trim().toLowerCase();
  if (SUPPORTED_CODING_LANGUAGES.includes(normalizedExplicit)) {
    return normalizedExplicit;
  }

  const combinedText = `${interviewData?.jobPosition || ""} ${interviewData?.jobDesc || ""}`.toLowerCase();
  if (combinedText.includes("python")) return "python";
  if (combinedText.includes("java")) return "java";
  if (combinedText.includes("c++")) return "cpp";
  if (combinedText.includes("typescript")) return "typescript";
  return "javascript";
};

const getStarterCode = (language) => {
  switch (language) {
    case "python":
      return ["def solve():", "    # Write your solution here", "    pass"].join("\n");
    case "java":
      return [
        "class Solution {",
        "  public void solve() {",
        "    // Write your solution here",
        "  }",
        "}",
      ].join("\n");
    case "cpp":
      return [
        "#include <bits/stdc++.h>",
        "using namespace std;",
        "",
        "int main() {",
        "  // Write your solution here",
        "  return 0;",
        "}",
      ].join("\n");
    case "typescript":
      return ["function solve(): void {", "  // Write your solution here", "}"].join("\n");
    default:
      return ["function solve() {", "  // Write your solution here", "}"].join("\n");
  }
};

const inferQuestionType = (question, interviewData) => {
  const explicitType = String(question?.questionType || "").trim().toLowerCase();
  if (explicitType === "coding" || explicitType === "theory") {
    return explicitType;
  }

  const roleText = `${interviewData?.jobPosition || ""} ${interviewData?.jobDesc || ""}`;
  const questionText = `${question?.question || ""} ${question?.focusArea || ""}`;
  return TECHNICAL_ROLE_PATTERN.test(roleText) && CODING_QUESTION_PATTERN.test(questionText)
    ? "coding"
    : "theory";
};

const getQuestionTimeLimit = (question) =>
  question?.questionType === "coding"
    ? CODING_TIME_BY_DIFFICULTY[question?.difficulty] || CODING_TIME_BY_DIFFICULTY.medium
    : DEFAULT_THEORY_TIME_SECONDS;

const normalizeQuestion = (question, index, interviewData = question?.interviewData || {}) => {
  const questionType = inferQuestionType(question, interviewData);
  const codingLanguage = inferCodingLanguage(interviewData, question?.codingLanguage);

  return {
    id: question?.id || `question-${index + 1}`,
    question: question?.question || "Question unavailable",
    answer: question?.answer || question?.idealAnswer || "No reference answer available.",
    difficulty: question?.difficulty || "medium",
    focusArea: question?.focusArea || "",
    questionType,
    codingLanguage,
    starterCode:
      questionType === "coding"
        ? String(question?.starterCode || "").trim() || getStarterCode(codingLanguage)
        : "",
  };
};

const pickRandomItem = (items = []) => items[Math.floor(Math.random() * items.length)];

const extractProjectHints = (answerHistory = []) => {
  return answerHistory
    .map((entry) => String(entry?.candidateAnswer || "").replace(/\s+/g, " ").trim().slice(0, 180))
    .filter(Boolean)
    .slice(-MAX_PROJECT_HINTS);
};

const summarizeResume = (resumeText = "") =>
  String(resumeText || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 450);

const compactPreviousQuestions = (questions = []) =>
  questions
    .slice(-MAX_PREVIOUS_QUESTIONS)
    .map((question) => String(question || "").replace(/\s+/g, " ").trim().slice(0, 180));

const compactPreviousAnswers = (answers = []) =>
  answers.slice(-MAX_PREVIOUS_ANSWERS).map((entry) => ({
    question: String(entry?.question || "").replace(/\s+/g, " ").trim().slice(0, 180),
    candidateAnswer: String(entry?.candidateAnswer || "").replace(/\s+/g, " ").trim().slice(0, 220),
    rating: String(entry?.rating || "").trim(),
    difficulty: String(entry?.difficulty || "").trim(),
    focusArea: String(entry?.focusArea || "").trim(),
    skipped: Boolean(entry?.skipped),
    feedbackSummary: String(entry?.feedbackSummary || "").replace(/\s+/g, " ").trim().slice(0, 140),
    behaviouralSignals: entry?.behaviouralSignals
      ? {
          confidenceScore: entry.behaviouralSignals.confidenceScore,
          clarityScore: entry.behaviouralSignals.clarityScore,
          focusScore: entry.behaviouralSignals.focusScore,
        }
      : null,
  }));

const getPreferredFocusArea = (previousQuestionItems = []) => {
  const usedFocusAreas = new Set(
    previousQuestionItems
      .map((item) => String(item?.focusArea || "").trim())
      .filter(Boolean)
  );

  return (
    FOCUS_AREA_SEQUENCE.find((focusArea) => !usedFocusAreas.has(focusArea)) ||
    "role-strengths"
  );
};

const getFallbackQuestion = ({
  interviewData,
  previousQuestionItems = [],
  previousQuestions = [],
  difficultyDirection = "baseline",
  skipped = false,
}) => {
  const role = interviewData?.jobPosition || "the target role";
  const stack = interviewData?.jobDesc || "the candidate's main skills";
  const resumeSummary = summarizeResume(interviewData?.resumeText);
  const hasResume = Boolean(resumeSummary);
  const allowCodingRounds = TECHNICAL_ROLE_PATTERN.test(`${role} ${stack}`);
  const preferredFocusArea = getPreferredFocusArea(previousQuestionItems);
  const isQuestionAvailable = (candidateQuestion) =>
    !previousQuestions.some((previousQuestion) =>
      areQuestionsTooSimilar(previousQuestion, candidateQuestion)
    );
  const secondQuestionPool = [
    {
      question: hasResume
        ? `From your resume, which project or experience best matches the ${role} role, and what problem were you solving there?`
        : `Tell me about one project you are most proud of for a ${role} role. What problem were you solving and why did it matter?`,
      answer: `A strong answer should explain the project context, problem statement, business or user impact, and the candidate's ownership. It should show relevance to the target role and thoughtful problem framing.`,
      difficulty: "easy",
      focusArea: "project-overview",
    },
    {
      question: hasResume
        ? `Looking at the experience on your resume, which responsibility best prepares you for the ${role} role, and where did you apply it in practice?`
        : `For the ${role} role, which core responsibility do you feel strongest in right now, and how have you applied it in practice?`,
      answer: `A strong answer should name one important role responsibility, explain why the candidate is strong in it, and support that claim with a concrete example. It should connect practical experience to the expectations of the role.`,
      difficulty: "easy",
      focusArea: "role-strengths",
    },
  ];
  const randomPool = {
    easy: [
      ...secondQuestionPool,
      {
        question: `Which part of the ${role} role feels most comfortable to you, and why?`,
        answer: `A strong answer should identify a clear strength area, explain the candidate's comfort with it, and give a practical example. It should sound confident but grounded in real work.`,
        difficulty: "easy",
        focusArea: "role-confidence",
      },
    ],
    medium: [
      ...(allowCodingRounds
        ? [{
            question: `Write a small function relevant to ${stack} that demonstrates clean logic, edge-case handling, and readable structure. Explain the approach after coding it.`,
            answer: `A strong answer should produce correct working logic, mention input assumptions, cover edge cases, and explain time and space complexity clearly. The final code should feel interview-ready rather than overly verbose.`,
            difficulty: "medium",
            focusArea: "problem-solving",
            questionType: "coding",
          }]
        : []),
      {
        question: `What architecture or technical approach did you choose in that project, and why was it a better fit than simpler alternatives?`,
        answer: `A strong answer should describe the chosen design, key tradeoffs, why it fit the constraints, and how it compared to alternative approaches. It should show technical decision-making rather than only tool listing.`,
        difficulty: "medium",
        focusArea: "architecture-tradeoffs",
      },
      {
        question: hasResume
          ? `Choose one project from your resume that is relevant to the ${role} role. What technologies did you use there, and what did each one contribute?`
          : `What technologies did you use in that project, and what specific role did each technology play in solving the problem?`,
        answer: `A strong answer should map technologies to responsibilities, explain why they were selected, and show understanding of where each tool added value. It should avoid buzzword listing without purpose.`,
        difficulty: "medium",
        focusArea: "technology-choice",
      },
      {
        question: `What tradeoff did you consciously make in your solution, and why was it the right call at that time?`,
        answer: `A strong answer should explain a real tradeoff, what options were considered, why one path was chosen, and what impact that decision had. It should show pragmatic engineering judgment.`,
        difficulty: "medium",
        focusArea: "tradeoff-analysis",
      },
      {
        question: `What made your project or solution different from similar existing solutions, and what was uniquely valuable about your implementation?`,
        answer: `A strong answer should explain differentiation through performance, usability, cost, scalability, workflow improvement, or innovation. It should connect uniqueness to real value rather than novelty alone.`,
        difficulty: "medium",
        focusArea: "solution-uniqueness",
      },
    ],
    hard: [
      ...(allowCodingRounds
        ? [{
            question: `Implement a coding solution for a role-relevant problem in ${stack}. Write the code, explain your logic, and mention the complexity tradeoffs you considered.`,
            answer: `A strong answer should define a correct algorithm, produce structured code, explain key steps, cover edge cases, and justify the complexity tradeoffs. It should sound like a real technical interview response.`,
            difficulty: "hard",
            focusArea: "problem-solving",
            questionType: "coding",
          }]
        : []),
      {
        question: `Describe a difficult challenge you faced in one of your projects and how you resolved it end to end.`,
        answer: `A strong answer should explain the challenge, root cause, debugging or problem-solving process, technical resolution, and final impact. It should show resilience and clear engineering thinking.`,
        difficulty: "hard",
        focusArea: "problem-solving",
      },
      {
        question: `If your project had to scale to 10x traffic or usage, what would break first and how would you redesign it?`,
        answer: `A strong answer should identify likely bottlenecks, explain system risks, and describe practical improvements around architecture, performance, and reliability. It should show systems thinking and prioritization.`,
        difficulty: "hard",
        focusArea: "scalability",
      },
      {
        question: `Tell me about a technical decision in your project that you would challenge or redesign today. Why?`,
        answer: `A strong answer should reflect honestly on a past decision, explain what was learned, and describe how the improved design would better satisfy current constraints. It should show maturity, not just self-criticism.`,
        difficulty: "hard",
        focusArea: "technical-reflection",
      },
    ],
  };
  const dynamicUniquePool = [
    {
      question: hasResume
        ? `From your resume, which frontend feature or module best shows your problem-solving for the ${role} role, and what decisions did you make while building it?`
        : `Describe one frontend feature you built that best represents your fit for the ${role} role, and explain the decisions you made while building it.`,
      answer: `A strong answer should identify a concrete feature, explain the goal, describe the implementation choices, and connect those choices to user or business impact.`,
      difficulty: skipped ? "easy" : "medium",
      focusArea: "feature-ownership",
    },
    {
      question: hasResume
        ? `Looking only at the projects in your resume, which one helped you grow the most as a ${role} candidate, and what exactly did you learn from it?`
        : `Which project helped you grow the most for the ${role} role, and what did you learn from that experience?`,
      answer: `A strong answer should describe a real project, explain the candidate's growth, mention a challenge or lesson, and connect the learning to the target role.`,
      difficulty: "easy",
      focusArea: "growth-reflection",
    },
    {
      question: hasResume
        ? `Pick one resume project relevant to ${stack}. How did you make sure the final user experience was actually usable and polished?`
        : `How do you make sure a frontend solution is usable and polished when building for real users?`,
      answer: `A strong answer should cover user experience decisions, testing or validation, responsiveness, accessibility, and how quality was verified before release.`,
      difficulty: "medium",
      focusArea: "ux-quality",
    },
    {
      question: hasResume
        ? `Which achievement from your resume most strongly proves you can perform well in the ${role} role, and why?`
        : `Which achievement best proves you are ready for the ${role} role, and why?`,
      answer: `A strong answer should mention a concrete achievement, explain the candidate's role, describe the impact, and connect it directly to the expectations of the role.`,
      difficulty: "easy",
      focusArea: "career-impact",
    },
    {
      question: hasResume
        ? `Pick one resume project and explain the hardest bug or issue you had to solve in it.`
        : `Tell me about a difficult bug or issue you solved in one of your projects.`,
      answer: `A strong answer should explain the bug, how it was diagnosed, what options were considered, and how the final fix improved the product or system.`,
      difficulty: "medium",
      focusArea: "debugging",
    },
  ];

  let template = {
    question: hasResume
      ? `Please introduce yourself for the ${role} role using the skills, experience, and projects shown in your resume. Focus on the parts most relevant to ${stack}.`
      : `Please introduce yourself as a candidate for the ${role} role, and highlight the projects or strengths most relevant to ${stack}.`,
    answer: `A strong answer should briefly cover background, role alignment, key technical strengths, and one or two relevant projects with measurable impact. It should be concise, structured, and role-focused.`,
    difficulty: "easy",
    focusArea: "self-introduction",
  };

  if (previousQuestions.length === 1) {
    const availableQuestions = secondQuestionPool.filter(
      (item) => isQuestionAvailable(item.question)
    );
    template = pickRandomItem(availableQuestions.length ? availableQuestions : secondQuestionPool);
  } else if (previousQuestions.length > 1) {
    const mappedDifficulty =
      skipped || difficultyDirection === "easier"
        ? "easy"
        : difficultyDirection === "harder"
        ? "hard"
        : "medium";
    const availableQuestions = randomPool[mappedDifficulty].filter(
      (item) =>
        isQuestionAvailable(item.question) &&
        (item.focusArea === preferredFocusArea || !previousQuestionItems.some((previousItem) => previousItem?.focusArea === item.focusArea))
    );

    if (availableQuestions.length > 0) {
      template = pickRandomItem(availableQuestions);
    } else {
      const allAvailableQuestions = [
        ...Object.values(randomPool).flat(),
        ...dynamicUniquePool,
      ]
        .flat()
        .filter(
          (item) =>
            isQuestionAvailable(item.question) &&
            (item.focusArea === preferredFocusArea ||
              !previousQuestionItems.some((previousItem) => previousItem?.focusArea === item.focusArea))
        );

      template = pickRandomItem(
        allAvailableQuestions.length ? allAvailableQuestions : [...randomPool[mappedDifficulty], ...dynamicUniquePool]
      );
    }
  }

  if (difficultyDirection === "easier") {
    template.difficulty = "easy";
  }
  if (difficultyDirection === "harder") {
    template.difficulty = "hard";
  }

  return normalizeQuestion(template, previousQuestions.length, interviewData);
};

const StartInterview = ({ params }) => {
  const router = useRouter();
  const [interViewData, setInterviewData] = useState();
  const [mockInterviewQuestion, setMockInterviewQuestion] = useState([]);
  const [answerHistory, setAnswerHistory] = useState([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [interviewTerminated, setInterviewTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState("");
  const [isQuestionBeingSpoken, setIsQuestionBeingSpoken] = useState(false);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(DEFAULT_THEORY_TIME_SECONDS);
  const [questionTimerExpired, setQuestionTimerExpired] = useState(false);
  const hasShownQuestionFallbackToastRef = useRef(false);
  const [proctoringState, setProctoringState] = useState({
    warningsCount: 0,
    warningMessages: [],
    hiddenTabEvents: 0,
    noFaceEvents: 0,
    multipleFaceEvents: 0,
    offCenterEvents: 0,
    checks: 0,
    faceVisibleChecks: 0,
    centeredChecks: 0,
    monitoringSupported: true,
    visionSupported: false,
    micReady: false,
    speechReady: false,
    fullscreenReady: false,
    currentViolation: "normal",
    currentViolationLabel: "Monitoring active",
    currentViolationReason: "",
    currentViolationStartedAt: 0,
  });

  const activeViolation = proctoringState.currentViolation;
  const currentQuestion = mockInterviewQuestion[activeQuestionIndex];
  const isCriticalCameraViolation = ["no_face", "multiple_faces", "camera_off"].includes(activeViolation);

  useEffect(() => {
    getInterviewDetails();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || interviewTerminated) {
      return;
    }

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [interviewTerminated]);

  useEffect(() => {
    if (!currentQuestion) {
      return;
    }

    setQuestionTimeLeft(getQuestionTimeLimit(currentQuestion));
    setQuestionTimerExpired(false);
  }, [activeQuestionIndex, currentQuestion?.id]);

  useEffect(() => {
    if (
      !currentQuestion ||
      interviewTerminated ||
      isGeneratingQuestion ||
      isQuestionBeingSpoken ||
      questionTimerExpired
    ) {
      return;
    }

    const interval = setInterval(() => {
      setQuestionTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(interval);
          setQuestionTimerExpired(true);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    currentQuestion?.id,
    interviewTerminated,
    isGeneratingQuestion,
    isQuestionBeingSpoken,
    questionTimerExpired,
  ]);

  const persistQuestions = async (questions) => {
    if (!interViewData?.mockId && !params?.interviewId) {
      return;
    }

    const currentPayload = parseInterviewPayload(interViewData?.jsonMockResp);
    const nextPayload = {
      ...currentPayload,
      questions,
    };

    const response = await fetch(`/api/interviews/${interViewData?.mockId || params.interviewId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonMockResp: JSON.stringify(nextPayload),
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.message || "Failed to persist interview questions.");
    }

    setInterviewData((previous) =>
      previous
        ? {
            ...previous,
            jsonMockResp: JSON.stringify(nextPayload),
            resumeText: nextPayload.resumeText,
            resumeFileName: nextPayload.resumeFileName,
          }
        : previous
    );
  };

  const generateAdaptiveQuestion = async ({
    previousAnswers = [],
    previousQuestionItems = [],
    previousQuestions = [],
    difficultyDirection = "baseline",
    skipped = false,
  } = {}) => {
    if (!interViewData) {
      return null;
    }

    const questionMode = pickRandomItem([
      "project deep dive",
      "role fundamentals",
      "behavioral reflection",
      "technical tradeoff",
    ]);
    const compactQuestions = compactPreviousQuestions(previousQuestions);
    const compactAnswers = compactPreviousAnswers(previousAnswers);
    const projectHints = extractProjectHints(previousAnswers);
    const resumeSummary = summarizeResume(interViewData?.resumeText);
    const hasResume = Boolean(resumeSummary);
    const preferredFocusArea = getPreferredFocusArea(previousQuestionItems);

    const ensureUniqueQuestion = (questionCandidate) => {
      if (!questionCandidate?.question) {
        return null;
      }

      const isUniqueEnough = !previousQuestions.some((previousQuestion) =>
        areQuestionsTooSimilar(previousQuestion, questionCandidate.question)
      );

      if (isUniqueEnough) {
        return questionCandidate;
      }

      return getFallbackQuestion({
        interviewData: interViewData,
        previousQuestionItems,
        previousQuestions,
        difficultyDirection,
        skipped,
      });
    };

    const prompt = `Adaptive interviewer.
Role: ${interViewData.jobPosition}
Stack: ${interViewData.jobDesc}
Experience: ${interViewData.jobExperience}
Resume: ${resumeSummary || "none"}
Asked: ${JSON.stringify(compactQuestions)}
Answers: ${JSON.stringify(compactAnswers)}
Hints: ${JSON.stringify(projectHints)}
Difficulty: ${difficultyDirection}
Skipped last: ${skipped}
First: ${previousQuestions.length === 0}
Second: ${previousQuestions.length === 1}
Mode: ${questionMode}
Focus: ${preferredFocusArea}

Rules:
- Ask exactly 1 new role-relevant question.
- First question: self-introduction.
- Second question: random project or fundamentals follow-up.
- ${hasResume ? "Use only role + resume facts. Do not invent details." : "Use role + prior answers only."}
- React to prior answers and hints.
- Avoid repeats and near-duplicates.
- Strong answer => harder. Weak/skip => easier.
- Technical roles may get a short realistic coding question.
- Natural interview tone.`;
    const formatInstructions = `Return JSON only:
{
  "question": "string",
  "answer": "strong reference answer in 3-6 sentences",
  "difficulty": "easy | medium | hard",
  "focusArea": "one of: self-introduction, project-overview, role-strengths, technology-choice, problem-solving, tradeoff-analysis, ux-quality, architecture-tradeoffs, solution-uniqueness, growth-reflection, scalability, technical-reflection, feature-ownership, career-impact, debugging",
  "questionType": "theory | coding",
  "codingLanguage": "javascript | typescript | python | java | cpp",
  "starterCode": "string, only when questionType is coding"
}`;

    try {
      const responseText = await sendGeminiPrompt(`${prompt}\n\n${formatInstructions}`);
      return ensureUniqueQuestion(
        normalizeQuestion(extractJsonFromText(responseText), previousQuestions.length, interViewData)
      );
    } catch (error) {
      console.error("AI question generation fallback triggered:", error);
      if (!hasShownQuestionFallbackToastRef.current) {
        hasShownQuestionFallbackToastRef.current = true;
        toast.info("AI question generation was unavailable, so the interview switched to built-in adaptive questions.");
      }
      return getFallbackQuestion({
        interviewData: interViewData,
        previousQuestionItems,
        previousQuestions,
        difficultyDirection,
        skipped,
      });
    }
  };

  const getInterviewDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/interviews/${params.interviewId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Interview details not found.");
      }

      const interview = data.interview;
      const parsedPayload = parseInterviewPayload(interview.jsonMockResp);
      setInterviewData({
        ...interview,
        resumeText: parsedPayload.resumeText,
        resumeFileName: parsedPayload.resumeFileName,
      });
      setAnswerHistory([]);

      const normalizedQuestions = Array.isArray(parsedPayload.questions)
        ? parsedPayload.questions.map((question, index) =>
            normalizeQuestion(question, index, interview)
          )
        : [];

      if (normalizedQuestions.length > 0) {
        setMockInterviewQuestion(normalizedQuestions.slice(0, MAX_QUESTIONS));
      } else {
        setMockInterviewQuestion([]);
      }
    } catch (error) {
      console.error("Failed to fetch interview details:", error);
      toast.error("Failed to load interview details.", {
        description: error?.message || "Please reload the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!interViewData || mockInterviewQuestion.length > 0) {
      return;
    }

    createFirstQuestion();
  }, [interViewData, mockInterviewQuestion.length]);

  const createFirstQuestion = async () => {
    try {
      setIsGeneratingQuestion(true);
      const firstQuestion = await generateAdaptiveQuestion();
      if (!firstQuestion) {
        throw new Error("Unable to generate the first question.");
      }

      const questionList = [firstQuestion];
      setMockInterviewQuestion(questionList);
      setActiveQuestionIndex(0);
      await persistQuestions(questionList);
    } catch (error) {
      console.error("Failed to generate first question:", error);
      toast.error("Failed to generate the first interview question.", {
        description: error?.message || "Please try again.",
      });
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const handleAnswerSave = async (answerRecord, normalizedFeedback) => {
    const currentQuestionNumber = activeQuestionIndex + 1;

    if (currentQuestionNumber >= MAX_QUESTIONS) {
      return;
    }

    try {
      setIsGeneratingQuestion(true);

      const rating = parseFloat(answerRecord?.rating || "0");
      const skipped =
        !String(answerRecord?.userAns || "").trim() ||
        String(answerRecord?.userAns || "").trim().toLowerCase() === "i don't know";
      const difficultyDirection = skipped || rating <= 4
        ? "easier"
        : rating >= 8
        ? "harder"
        : "similar";
      const currentQuestion = mockInterviewQuestion[activeQuestionIndex];
      const nextAnswerHistory = [
        ...answerHistory,
        {
          question: currentQuestion?.question,
          referenceAnswer: currentQuestion?.answer,
          candidateAnswer: answerRecord?.userAns,
          rating: answerRecord?.rating,
          difficulty: currentQuestion?.difficulty,
          focusArea: currentQuestion?.focusArea,
          behaviouralSignals: normalizedFeedback?.deliverySignals || null,
          feedbackSummary: normalizedFeedback?.feedback || "",
          skipped,
        },
      ];

      const nextQuestion = await generateAdaptiveQuestion({
        previousAnswers: nextAnswerHistory,
        previousQuestionItems: mockInterviewQuestion.slice(0, currentQuestionNumber),
        previousQuestions: mockInterviewQuestion
          .slice(0, currentQuestionNumber)
          .map((item) => item.question),
        difficultyDirection,
        skipped,
      });

      if (!nextQuestion) {
        throw new Error("Unable to generate the next question.");
      }

      const updatedQuestions = [
        ...mockInterviewQuestion.slice(0, currentQuestionNumber),
        nextQuestion,
      ];

      setAnswerHistory(nextAnswerHistory);
      setMockInterviewQuestion(updatedQuestions);
      setActiveQuestionIndex(currentQuestionNumber);
      await persistQuestions(updatedQuestions);
      toast.success(`Question ${currentQuestionNumber + 1} is ready.`);
    } catch (error) {
      console.error("Failed to generate next question:", error);
      toast.error("Failed to generate the next adaptive question.", {
        description: error?.message || "Please try again.",
      });
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const handleInterviewTermination = ({ reason }) => {
    setInterviewTerminated(true);
    setTerminationReason(reason);
  };

  const handleEndInterview = () => {
    router.push(`/dashboard/interview/${interViewData?.mockId}/feedback`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin" />
          <p className="mt-4 text-gray-600">Loading interview details...</p>
        </div>
      </div>
    );
  }

  if (!mockInterviewQuestion || mockInterviewQuestion.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin" />
          <p className="mt-4 text-gray-600">
            {isGeneratingQuestion
              ? "Generating your first adaptive interview question..."
              : "No interview questions found."}
          </p>
          {!isGeneratingQuestion && (
            <Button className="mt-4" onClick={() => createFirstQuestion()}>
              Retry Interview Setup
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Interview In Progress</p>
          <h1 className="mt-1.5 text-xl font-bold text-slate-900 md:text-2xl">
            {interViewData?.jobPosition} Interview
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Camera and microphone try to start automatically when you enter this page.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
            Warnings: {proctoringState.warningsCount}/3
          </div>
          <Link href={`/dashboard/interview/${interViewData?.mockId}/feedback`}>
            <Button variant="outline" className="w-full sm:w-auto">
              <FileText className="mr-2 h-4 w-4" />
              Current Report
            </Button>
          </Link>
          <Button variant="destructive" className="w-full sm:w-auto" onClick={handleEndInterview}>
            <SquareTerminal className="mr-2 h-4 w-4" />
            End Interview
          </Button>
        </div>
      </div>

      {isCriticalCameraViolation && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3.5">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">
                {proctoringState.currentViolationLabel || "Camera violation detected"}
              </h3>
              <p className="mt-1 text-sm text-red-900">
                {proctoringState.currentViolationReason ||
                  "Return to a valid camera state to continue the interview and save your answer."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <AdaptiveQuestionsSection
          mockInterviewQuestion={mockInterviewQuestion}
          activeQuestionIndex={activeQuestionIndex}
          proctoringState={proctoringState}
          interviewTerminated={interviewTerminated}
          isGeneratingQuestion={isGeneratingQuestion}
          maxQuestions={MAX_QUESTIONS}
          onQuestionSpeechStateChange={setIsQuestionBeingSpoken}
          currentQuestion={currentQuestion}
          questionTimeLeft={questionTimeLeft}
          questionTimerExpired={questionTimerExpired}
        />
        <RecordAnswerSection
          mockInterviewQuestion={mockInterviewQuestion}
          activeQuestionIndex={activeQuestionIndex}
          interviewData={interViewData}
          proctoringState={proctoringState}
          onAnswerSave={handleAnswerSave}
          onProctoringUpdate={setProctoringState}
          onInterviewTerminated={handleInterviewTermination}
          interviewTerminated={interviewTerminated}
          isGeneratingQuestion={isGeneratingQuestion}
          isQuestionBeingSpoken={isQuestionBeingSpoken}
          currentQuestion={currentQuestion}
          questionTimeLeft={questionTimeLeft}
          questionTimerExpired={questionTimerExpired}
        />
      </div>

      {proctoringState.warningMessages.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-amber-800">Recent Interview Warnings</h3>
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-amber-900">
              {proctoringState.warningMessages.length} recent
            </span>
          </div>
          <ul className="mt-2 space-y-1.5 text-sm text-amber-900">
            {proctoringState.warningMessages.map((warning, index) => (
              <li key={`${warning}-${index}`} className="rounded-lg bg-white/70 px-3 py-2.5">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {interviewTerminated && (
        <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4">
          <h3 className="text-base font-bold text-red-700">Interview Terminated</h3>
          <p className="mt-1.5 text-sm text-red-900">
            {terminationReason || "Repeated monitoring violations were detected."}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href={`/dashboard/interview/${interViewData?.mockId}/feedback`}>
              <Button>View Partial Feedback</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Return to Dashboard</Button>
            </Link>
          </div>
        </div>
      )}

      <div className="mt-5 flex justify-end gap-3">
        {activeQuestionIndex > 0 && (
          <Button
            onClick={() => setActiveQuestionIndex(activeQuestionIndex - 1)}
            disabled={interviewTerminated || isGeneratingQuestion}
          >
            Previous Question
          </Button>
        )}
        {activeQuestionIndex < mockInterviewQuestion.length - 1 && (
          <Button
            onClick={() => setActiveQuestionIndex(activeQuestionIndex + 1)}
            disabled={interviewTerminated || isGeneratingQuestion}
          >
            Next Question
          </Button>
        )}
        {(interviewTerminated ||
          (mockInterviewQuestion.length >= MAX_QUESTIONS &&
            activeQuestionIndex === mockInterviewQuestion.length - 1)) && (
          <Link href={`/dashboard/interview/${interViewData?.mockId}/feedback`}>
            <Button>End Interview</Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default StartInterview;
