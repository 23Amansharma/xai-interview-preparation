import { formatInterviewDateLabel, parseInterviewDateValue } from "@/utils/date";

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

export const areQuestionsTooSimilar = (leftQuestion = "", rightQuestion = "") => {
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

export const dedupeFeedbackEntries = (entries = []) => {
  const uniqueEntries = [];

  entries.forEach((entry) => {
    const existingIndex = uniqueEntries.findIndex((savedEntry) =>
      areQuestionsTooSimilar(savedEntry.question, entry.question)
    );

    if (existingIndex === -1) {
      uniqueEntries.push(entry);
      return;
    }

    const savedEntry = uniqueEntries[existingIndex];
    const savedRating = Number.parseFloat(savedEntry.rating || "0");
    const currentRating = Number.parseFloat(entry.rating || "0");
    const savedAnswerLength = String(savedEntry.userAns || "").trim().length;
    const currentAnswerLength = String(entry.userAns || "").trim().length;

    if (currentAnswerLength > savedAnswerLength || currentRating > savedRating) {
      uniqueEntries[existingIndex] = entry;
    }
  });

  return uniqueEntries;
};

export const parseInterviewDate = (value) => {
  return parseInterviewDateValue(value);
};

export const formatInterviewDate = (value) => {
  const timestamp = typeof value === "number" ? value : parseInterviewDate(value);
  if (!timestamp) {
    return "Unknown";
  }

  return formatInterviewDateLabel(timestamp);
};

export const parseFeedbackDetails = (feedback) => {
  if (!feedback) {
    return {
      feedback: "No detailed feedback available.",
      scoreReasoning: [],
      strengths: [],
      improvementAreas: [],
      futureSuggestions: [],
      deliverySignals: null,
      proctoring: null,
    };
  }

  try {
    const parsed = JSON.parse(feedback);
    return {
      feedback: parsed?.feedback || "No detailed feedback available.",
      scoreReasoning: Array.isArray(parsed?.scoreReasoning) ? parsed.scoreReasoning : [],
      strengths: Array.isArray(parsed?.strengths) ? parsed.strengths : [],
      improvementAreas: Array.isArray(parsed?.improvementAreas) ? parsed.improvementAreas : [],
      futureSuggestions: Array.isArray(parsed?.futureSuggestions) ? parsed.futureSuggestions : [],
      deliverySignals: parsed?.deliverySignals || null,
      proctoring: parsed?.proctoring || null,
    };
  } catch (_error) {
    return {
      feedback,
      scoreReasoning: [],
      strengths: [],
      improvementAreas: [],
      futureSuggestions: [],
      deliverySignals: null,
      proctoring: null,
    };
  }
};

export const summarizeTopItems = (items, limit = 5) => {
  const counts = new Map();

  items
    .filter(Boolean)
    .map((item) => item.trim())
    .forEach((item) => {
      counts.set(item, (counts.get(item) || 0) + 1);
    });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([text]) => text);
};

export const averageMetric = (items, key) => {
  const values = items
    .map((item) => item.feedbackDetails?.deliverySignals?.[key])
    .filter((value) => typeof value === "number" && !Number.isNaN(value));

  if (!values.length) {
    return null;
  }

  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
};

export const sumMetric = (items, key) =>
  items.reduce(
    (sum, item) => sum + Number(item.feedbackDetails?.proctoring?.[key] || 0),
    0
  );

export const getReadinessSummary = (averageRating) => {
  const avg = parseFloat(averageRating);

  if (Number.isNaN(avg)) {
    return {
      label: "Insufficient Data",
      tone: "neutral",
      description: "Complete more interview questions to assess readiness.",
    };
  }

  if (avg >= 8) {
    return {
      label: "Ready For Real Interviews",
      tone: "success",
      description: "Your answers are consistently strong, but keep refining delivery and precision.",
    };
  }

  if (avg >= 6) {
    return {
      label: "Almost Ready",
      tone: "warning",
      description: "You have a solid base, but a few repeated weak areas still need focused practice.",
    };
  }

  return {
    label: "Needs More Preparation",
    tone: "danger",
    description: "You should strengthen fundamentals, delivery, and answer structure before real interviews.",
  };
};

export const parseInterviewPayload = (rawPayload) => {
  try {
    const parsedPayload = JSON.parse(rawPayload || "{}");

    if (Array.isArray(parsedPayload)) {
      return {
        questions: parsedPayload,
        resumeText: "",
        resumeFileName: "",
        reportEmailSentAt: "",
        reportEmailStatus: "idle",
      };
    }

    return {
      questions: Array.isArray(parsedPayload?.questions) ? parsedPayload.questions : [],
      resumeText: String(parsedPayload?.resumeText || ""),
      resumeFileName: String(parsedPayload?.resumeFileName || ""),
      reportEmailSentAt: String(parsedPayload?.reportEmailSentAt || ""),
      reportEmailStatus: String(parsedPayload?.reportEmailStatus || "idle"),
    };
  } catch (_error) {
    return {
      questions: [],
      resumeText: "",
      resumeFileName: "",
      reportEmailSentAt: "",
      reportEmailStatus: "idle",
    };
  }
};

export const buildInterviewSummaries = (answers = [], interviews = []) => {
  const interviewMap = new Map(
    interviews.map((interview) => [
      interview.mockId,
      {
        jobPosition: interview.jobPosition,
        jobDesc: interview.jobDesc,
        jobExperience: interview.jobExperience,
        createdAt: parseInterviewDate(interview.createdAt),
      },
    ])
  );
  const groupedByInterview = new Map();

  answers.forEach((answer, index) => {
    const key = answer.mockIdRef || `interview-${index}`;
    const interviewInfo = interviewMap.get(key) || {};
    const current = groupedByInterview.get(key) || {
      mockId: key,
      scores: [],
      createdAt: interviewInfo.createdAt || parseInterviewDate(answer.createdAt),
      id: Number(answer.id || index),
      questionCount: 0,
      strengths: [],
      improvementAreas: [],
      focusScore: [],
      confidenceScore: [],
      clarityScore: [],
      warningsCount: 0,
      hiddenTabEvents: 0,
      noFaceEvents: 0,
      multipleFaceEvents: 0,
      offCenterEvents: 0,
      jobPosition: interviewInfo.jobPosition || "Interview Session",
      jobDesc: interviewInfo.jobDesc || "",
      jobExperience: interviewInfo.jobExperience || "",
    };

    const score = Number.parseFloat(answer.rating || "0");
    const feedbackDetails = parseFeedbackDetails(answer.feedback);

    if (Number.isFinite(score) && score > 0) {
      current.scores.push(score);
    }

    current.questionCount += 1;
    current.strengths.push(...feedbackDetails.strengths);
    current.improvementAreas.push(...feedbackDetails.improvementAreas);

    ["focusScore", "confidenceScore", "clarityScore"].forEach((metricKey) => {
      const metricValue = feedbackDetails?.deliverySignals?.[metricKey];
      if (typeof metricValue === "number" && !Number.isNaN(metricValue)) {
        current[metricKey].push(metricValue);
      }
    });

    current.warningsCount += Number(feedbackDetails?.proctoring?.warningsCount || 0);
    current.hiddenTabEvents += Number(feedbackDetails?.proctoring?.hiddenTabEvents || 0);
    current.noFaceEvents += Number(feedbackDetails?.proctoring?.noFaceEvents || 0);
    current.multipleFaceEvents += Number(feedbackDetails?.proctoring?.multipleFaceEvents || 0);
    current.offCenterEvents += Number(feedbackDetails?.proctoring?.offCenterEvents || 0);

    current.createdAt = Math.min(
      current.createdAt || Infinity,
      interviewInfo.createdAt || parseInterviewDate(answer.createdAt) || Infinity
    );
    current.id = Math.min(current.id, Number(answer.id || index));
    groupedByInterview.set(key, current);
  });

  return [...groupedByInterview.values()]
    .map((interview) => ({
      ...interview,
      averageScore: interview.scores.length
        ? Number((interview.scores.reduce((sum, score) => sum + score, 0) / interview.scores.length).toFixed(1))
        : 0,
      focusAverage: interview.focusScore.length
        ? Number((interview.focusScore.reduce((sum, value) => sum + value, 0) / interview.focusScore.length).toFixed(1))
        : null,
      confidenceAverage: interview.confidenceScore.length
        ? Number((interview.confidenceScore.reduce((sum, value) => sum + value, 0) / interview.confidenceScore.length).toFixed(1))
        : null,
      clarityAverage: interview.clarityScore.length
        ? Number((interview.clarityScore.reduce((sum, value) => sum + value, 0) / interview.clarityScore.length).toFixed(1))
        : null,
      topStrengths: summarizeTopItems(interview.strengths, 2),
      topImprovementAreas: summarizeTopItems(interview.improvementAreas, 2),
      formattedDate: formatInterviewDate(interview.createdAt),
    }))
    .filter((interview) => interview.questionCount > 0)
    .sort((a, b) => {
      if (a.createdAt !== b.createdAt) {
        return a.createdAt - b.createdAt;
      }

      return a.id - b.id;
    });
};

export const calculateImprovementRate = (interviewSummaries = []) => {
  if (interviewSummaries.length <= 1) {
    return 0;
  }

  const firstScore = interviewSummaries[0].averageScore;
  const latestScore = interviewSummaries[interviewSummaries.length - 1].averageScore;

  if (firstScore <= 0) {
    return 0;
  }

  const improvement = ((latestScore - firstScore) / firstScore) * 100;
  return Math.max(-100, Math.round(improvement));
};

const buildDeliveryInsight = (latestInterview = null, summary = {}) => {
  const {
    totalInterviews = 0,
    latestScore = 0,
    topStrengths = [],
    topImprovementAreas = [],
  } = summary;

  if (!latestInterview) {
    return {
      title: "No scored interview yet",
      description: "Complete your first mock interview to generate AI coaching from your actual answers and delivery.",
    };
  }

  const deliveryMetrics = [
    { label: "focus", value: latestInterview.focusAverage ?? null },
    { label: "confidence", value: latestInterview.confidenceAverage ?? null },
    { label: "clarity", value: latestInterview.clarityAverage ?? null },
  ].filter((metric) => typeof metric.value === "number" && !Number.isNaN(metric.value));

  if (!deliveryMetrics.length) {
    const improvementHint =
      latestInterview.topImprovementAreas?.[0] ||
      topImprovementAreas?.[0] ||
      latestInterview.topStrengths?.[0] ||
      topStrengths?.[0] ||
      "";

    return {
      title: totalInterviews > 0 ? "Interview feedback is available" : "No scored interview yet",
      description: improvementHint
        ? `Recent pattern: ${improvementHint}.`
        : "We have interview history, but not enough delivery-signal data yet for a speaking-specific insight.",
    };
  }

  const strongestMetric = deliveryMetrics.reduce((best, metric) =>
    metric.value > best.value ? metric : best
  );
  const weakestMetric = deliveryMetrics.reduce((lowest, metric) =>
    metric.value < lowest.value ? metric : lowest
  );
  const topStrength = latestInterview.topStrengths?.[0] || topStrengths?.[0];
  const topImprovementArea = latestInterview.topImprovementAreas?.[0] || topImprovementAreas?.[0];

  const title =
    weakestMetric.value >= 7.5
      ? "Delivery looks interview-ready"
      : weakestMetric.label === "confidence"
        ? "Delivery needs more confidence"
        : weakestMetric.label === "clarity"
          ? "Delivery needs sharper clarity"
          : "Delivery needs steadier focus";

  const descriptionParts = [];

  if (topStrength) {
    descriptionParts.push(`Strong point: ${topStrength}.`);
  } else {
    descriptionParts.push(`Best signal: ${strongestMetric.label} at ${strongestMetric.value}/10.`);
  }

  if (topImprovementArea) {
    descriptionParts.push(`Improve next: ${topImprovementArea}.`);
  } else {
    descriptionParts.push(`Raise ${weakestMetric.label} to improve overall delivery.`);
  }

  if (latestScore) {
    descriptionParts.push(`Latest score: ${latestScore}/10.`);
  }

  return {
    title,
    description: descriptionParts.join(" "),
  };
};

export const buildDashboardAnalytics = (answers = [], interviews = []) => {
  const interviewSummaries = buildInterviewSummaries(answers, interviews);
  const totalInterviews = interviewSummaries.length;
  const bestScore = totalInterviews
    ? Math.max(...interviewSummaries.map((item) => item.averageScore))
    : 0;
  const latestScore = totalInterviews
    ? interviewSummaries[interviewSummaries.length - 1].averageScore
    : 0;
  const improvementRate = calculateImprovementRate(interviewSummaries);
  const averageQuestionsPerInterview = totalInterviews
    ? Number(
        (
          interviewSummaries.reduce((sum, interview) => sum + interview.questionCount, 0) /
          totalInterviews
        ).toFixed(1)
      )
    : 0;
  const topStrengths = summarizeTopItems(
    interviewSummaries.flatMap((interview) => interview.topStrengths),
    3
  );
  const topImprovementAreas = summarizeTopItems(
    interviewSummaries.flatMap((interview) => interview.topImprovementAreas),
    3
  );
  const latestInterview = totalInterviews
    ? interviewSummaries[interviewSummaries.length - 1]
    : null;

  return {
    totalInterviews,
    bestScore,
    latestScore,
    improvementRate,
    averageQuestionsPerInterview,
    topStrengths,
    topImprovementAreas,
    scoreTrend: interviewSummaries.map((interview, index) => ({
      label: `Session ${index + 1}`,
      dateLabel: interview.formattedDate,
      score: interview.averageScore,
      questions: interview.questionCount,
    })),
    deliveryTrend: interviewSummaries.map((interview, index) => ({
      label: `S${index + 1}`,
      focus: interview.focusAverage,
      confidence: interview.confidenceAverage,
      clarity: interview.clarityAverage,
    })),
    latestSpeakingProfile: latestInterview
      ? {
          focus: latestInterview.focusAverage,
          confidence: latestInterview.confidenceAverage,
          clarity: latestInterview.clarityAverage,
          topStrength: latestInterview.topStrengths?.[0] || "",
          topImprovementArea: latestInterview.topImprovementAreas?.[0] || "",
        }
      : null,
    coachInsight: buildDeliveryInsight(latestInterview, {
      totalInterviews,
      latestScore,
      topStrengths,
      topImprovementAreas,
    }),
    latestSessions: [...interviewSummaries].reverse().slice(0, 4),
  };
};

export const buildInterviewReport = (answers = [], interview = null) => {
  const enrichedAnswers = answers.map((item) => ({
    ...item,
    feedbackDetails: parseFeedbackDetails(item.feedback),
  }));
  const feedbackList = dedupeFeedbackEntries(enrichedAnswers);
  const validRatings = feedbackList
    .map((item) => Number.parseFloat(item.rating))
    .filter((rating) => !Number.isNaN(rating));
  const averageRating = validRatings.length
    ? Number((validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length).toFixed(1))
    : null;

  const deliverySignals = {
    confidenceScore: averageMetric(feedbackList, "confidenceScore"),
    nervousnessScore: averageMetric(feedbackList, "nervousnessScore"),
    clarityScore: averageMetric(feedbackList, "clarityScore"),
    knowledgeClarityScore: averageMetric(feedbackList, "knowledgeClarityScore"),
    focusScore: averageMetric(feedbackList, "focusScore"),
  };
  const proctoringSummary = {
    warningsCount: sumMetric(feedbackList, "warningsCount"),
    hiddenTabEvents: sumMetric(feedbackList, "hiddenTabEvents"),
    noFaceEvents: sumMetric(feedbackList, "noFaceEvents"),
    multipleFaceEvents: sumMetric(feedbackList, "multipleFaceEvents"),
    offCenterEvents: sumMetric(feedbackList, "offCenterEvents"),
  };
  const overallInsights = {
    topStrengths: summarizeTopItems(
      feedbackList.flatMap((item) => item.feedbackDetails.strengths)
    ),
    topImprovementAreas: summarizeTopItems(
      feedbackList.flatMap((item) => item.feedbackDetails.improvementAreas)
    ),
    futureSuggestions: summarizeTopItems(
      feedbackList.flatMap((item) => item.feedbackDetails.futureSuggestions)
    ),
    scoreReasons: summarizeTopItems(
      feedbackList.flatMap((item) => item.feedbackDetails.scoreReasoning)
    ),
    readinessReasons: summarizeTopItems(
      [
        ...feedbackList.flatMap((item) => item.feedbackDetails.scoreReasoning),
        ...feedbackList.flatMap((item) => item.feedbackDetails.improvementAreas),
        ...feedbackList.flatMap((item) => item.feedbackDetails.futureSuggestions),
      ],
      5
    ),
    deliverySignals,
    proctoringSummary,
  };

  return {
    interview,
    feedbackList,
    averageRating,
    overallInsights,
    readiness: getReadinessSummary(averageRating),
    totalQuestions: feedbackList.length,
  };
};
