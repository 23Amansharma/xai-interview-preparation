"use client";

import React, { useMemo, useState } from "react";
import { ArrowRight, Brain, CheckCircle2, Download, Lightbulb, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildSkillAssessmentPdf, downloadPdfFile } from "@/utils/report-pdf";

const ASSESSMENTS = [
  {
    id: "aptitude",
    title: "Aptitude Essentials",
    subtitle: "Quant, reasoning, and problem-solving basics",
    questions: [
      {
        prompt: "A train crosses a platform in 36 seconds and a pole in 24 seconds. If the train speed is 54 km/h, what is the platform length?",
        options: ["120 m", "150 m", "180 m", "210 m"],
        answer: "180 m",
        concept: "Speed, time, and distance",
      },
      {
        prompt: "Find the missing number in the series: 7, 13, 25, 49, 97, ?",
        options: ["161", "181", "193", "201"],
        answer: "193",
        concept: "Advanced number pattern recognition",
      },
      {
        prompt: "Statements: All analysts are planners. Some planners are consultants. Which conclusion must be true?",
        options: [
          "All consultants are analysts",
          "Some analysts are consultants",
          "Some planners are consultants",
          "No analyst is a consultant",
        ],
        answer: "Some planners are consultants",
        concept: "Logical deduction and syllogism",
      },
    ],
    recommendations: [
      "Revise percentages, ratios, speed-distance-time, and profit-loss.",
      "Practice logical series, seating arrangement, and syllogism sets.",
      "Time-box each question so accuracy and speed improve together.",
    ],
  },
  {
    id: "communication",
    title: "Communication Readiness",
    subtitle: "Business writing, clarity, and interview expression",
    questions: [
      {
        prompt: "Which answer opening is strongest when the interviewer asks a complex problem-solving question?",
        options: [
          "There are a lot of possible answers, so I will just start randomly",
          "I would first define the objective, then evaluate constraints, and finally compare solution paths",
          "This depends on many things, so there is no clear answer",
          "I would probably do whatever my last team did",
        ],
        answer: "I would first define the objective, then evaluate constraints, and finally compare solution paths",
        concept: "Executive communication structure",
      },
      {
        prompt: "Which resume bullet is the most credible and ATS-friendly for an analyst or operations role?",
        options: [
          "Helped teams in many business activities",
          "Worked on reporting, documentation, and multiple support tasks",
          "Reduced weekly reporting turnaround from 2 days to 6 hours by automating Excel and SQL workflows",
          "Was responsible for operations and communication",
        ],
        answer: "Reduced weekly reporting turnaround from 2 days to 6 hours by automating Excel and SQL workflows",
        concept: "Impact-driven resume writing",
      },
      {
        prompt: "In a behavioral interview, what most commonly weakens an otherwise good STAR answer?",
        options: [
          "Keeping the result measurable",
          "Explaining your personal contribution clearly",
          "Spending too long on background and too little on actions and results",
          "Connecting the example to the target role",
        ],
        answer: "Spending too long on background and too little on actions and results",
        concept: "Behavioral answer quality",
      },
    ],
    recommendations: [
      "Use STAR or a 3-step structure in spoken answers.",
      "Prefer impact-based wording with metrics over vague statements.",
      "Practice short, clear openings before detailed explanation.",
    ],
  },
  {
    id: "technical",
    title: "Technical Foundations",
    subtitle: "Programming, debugging, and systems basics",
    questions: [
      {
        prompt: "If you need LRU cache behavior with near O(1) get and put operations, which combination is typically used?",
        options: [
          "Array + stack",
          "Hash map + doubly linked list",
          "Queue + recursion",
          "Binary search tree + heap",
        ],
        answer: "Hash map + doubly linked list",
        concept: "Data structures and system design patterns",
      },
      {
        prompt: "Which Git workflow best protects a production branch in a collaborative team?",
        options: [
          "Commit directly to main so delivery is faster",
          "Use feature branches, pull requests, and code review before merging",
          "Keep all work local until release day",
          "Avoid branching because it increases complexity",
        ],
        answer: "Use feature branches, pull requests, and code review before merging",
        concept: "Version control workflow",
      },
      {
        prompt: "After completing a coding solution in an interview, what is the highest-value next step?",
        options: [
          "Immediately stop talking so the interviewer can decide",
          "Read the code once and mention edge cases, complexity, and possible optimizations",
          "Only justify the syntax style you used",
          "Move to a completely different approach without being asked",
        ],
        answer: "Read the code once and mention edge cases, complexity, and possible optimizations",
        concept: "Code review communication",
      },
    ],
    recommendations: [
      "Revise arrays, strings, hash maps, recursion, and SQL basics.",
      "Always explain edge cases after coding.",
      "Practice debugging small broken snippets under time pressure.",
    ],
  },
];

export default function SkillAssessmentPage() {
  const [activeId, setActiveId] = useState(ASSESSMENTS[0].id);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const activeAssessment = useMemo(
    () => ASSESSMENTS.find((item) => item.id === activeId) || ASSESSMENTS[0],
    [activeId]
  );

  const currentAnswers = answers[activeId] || {};
  const score = activeAssessment.questions.reduce(
    (total, question, index) => total + (currentAnswers[index] === question.answer ? 1 : 0),
    0
  );
  const answeredCount = Object.keys(currentAnswers).length;
  const percentage = Math.round((score / activeAssessment.questions.length) * 100);
  const missedConcepts = activeAssessment.questions
    .filter((question, index) => currentAnswers[index] && currentAnswers[index] !== question.answer)
    .map((question) => question.concept)
    .filter(Boolean);

  const readiness = useMemo(() => {
    if (!showResult) {
      return {
        label: "Assessment pending",
        summary: "Complete the assessment to unlock a concise readiness summary and recommended next steps.",
      };
    }

    if (percentage >= 80) {
      return {
        label: "Strong readiness",
        summary: "Your fundamentals look interview-ready in this area. Keep practicing timed responses so accuracy and confidence stay consistent under pressure.",
      };
    }

    if (percentage >= 50) {
      return {
        label: "Developing readiness",
        summary: "You have a workable foundation, but a focused revision pass will noticeably improve interview quality and answer precision.",
      };
    }

    return {
      label: "Needs reinforcement",
      summary: "This area needs a more structured practice cycle before high-stakes interviews. Revise core concepts first, then retest under time pressure.",
    };
  }, [percentage, showResult]);

  const downloadAssessmentReport = () => {
    if (!showResult) {
      return;
    }

    const pdfBytes = buildSkillAssessmentPdf({
      assessmentTitle: activeAssessment.title,
      assessmentSubtitle: activeAssessment.subtitle,
      score,
      percentage,
      answeredCount,
      totalQuestions: activeAssessment.questions.length,
      readinessLabel: readiness.label,
      readinessSummary: readiness.summary,
      recommendations: activeAssessment.recommendations,
      missedConcepts,
    });

    downloadPdfFile(
      `${activeAssessment.id}-skill-assessment-report.pdf`,
      pdfBytes
    );
  };

  const handleSelect = (questionIndex, option) => {
    setAnswers((previous) => ({
      ...previous,
      [activeId]: {
        ...(previous[activeId] || {}),
        [questionIndex]: option,
      },
    }));
  };

  const resetAssessment = () => {
    setAnswers((previous) => ({
      ...previous,
      [activeId]: {},
    }));
    setShowResult(false);
    setReportOpen(false);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eef2ff_0%,#ffffff_38%,#f8fafc_100%)] px-4 py-12 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        <section className="rounded-[36px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                <Brain className="h-4 w-4" />
                Skill Assessment
              </div>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Test the skills that matter before your interview
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                Use quick in-app assessments to gauge aptitude, communication, and technical readiness. Each report stays concise and points you toward the highest-value improvements.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              {ASSESSMENTS.map((assessment) => (
                <button
                  key={assessment.id}
                  type="button"
                  onClick={() => {
                    setActiveId(assessment.id);
                    setShowResult(false);
                    setReportOpen(false);
                  }}
                  className={`rounded-[28px] border p-5 text-left shadow-sm transition ${
                    activeId === assessment.id
                      ? "border-indigo-200 bg-indigo-50"
                      : "border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fafc_100%)]"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{assessment.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{assessment.subtitle}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Active Assessment</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">{activeAssessment.title}</h2>
                <p className="mt-2 text-sm text-slate-500">{activeAssessment.subtitle}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Progress</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {answeredCount}/{activeAssessment.questions.length}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {activeAssessment.questions.map((question, questionIndex) => (
                <div key={question.prompt} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    {questionIndex + 1}. {question.prompt}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {question.options.map((option) => {
                      const isSelected = currentAnswers[questionIndex] === option;
                      const isCorrect = question.answer === option;
                      const showCorrect = showResult && isCorrect;
                      const showWrong = showResult && isSelected && !isCorrect;

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleSelect(questionIndex, option)}
                          className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                            showCorrect
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                              : showWrong
                              ? "border-rose-300 bg-rose-50 text-rose-800"
                              : isSelected
                              ? "border-indigo-300 bg-indigo-50 text-indigo-800"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={() => {
                  setShowResult(true);
                  setReportOpen(true);
                }}
                disabled={answeredCount !== activeAssessment.questions.length}
                className="rounded-2xl"
              >
                Generate Report
              </Button>
              <Button type="button" variant="outline" onClick={resetAssessment} className="rounded-2xl">
                Reset
              </Button>
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Assessment Summary</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">Your quick readiness snapshot</h2>
              </div>
            </div>

            <div className="mt-6 rounded-[26px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Score</p>
              <p className="mt-2 text-4xl font-semibold text-slate-900">{showResult ? `${percentage}%` : "--"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {readiness.summary}
              </p>
            </div>

            <div className="mt-5 rounded-[26px] border border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fafc_100%)] p-5">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-semibold text-slate-900">Improvement Tips</p>
              </div>
              <div className="mt-4 space-y-3">
                {activeAssessment.recommendations.map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-[26px] border border-indigo-200 bg-indigo-50 p-5">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-indigo-600" />
                <p className="text-sm font-semibold text-indigo-900">Recommended Next Step</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-indigo-950">
                {activeAssessment.id === "technical"
                  ? "Follow this with a coding mock interview so you can test speed, explanation quality, and correctness together."
                  : activeAssessment.id === "communication"
                  ? "Use the AI interview flow next and focus on structured, concise speaking."
                  : "Practice an aptitude round first, then move into a timed interview session for complete preparation."}
              </p>
              <div className="mt-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="rounded-2xl">
                    <a href="/dashboard">
                      Start Practice
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl"
                    disabled={!showResult}
                    onClick={downloadAssessmentReport}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-2xl rounded-[28px] border-slate-200 p-0">
          <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-7">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-slate-900">
                {activeAssessment.title} Report
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-slate-500">
                Concise readiness report for your current assessment attempt.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Score</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{score}/{activeAssessment.questions.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Accuracy</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{percentage}%</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Readiness</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{readiness.label}</p>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Summary</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{readiness.summary}</p>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5">
                <p className="text-sm font-semibold text-emerald-900">What to keep doing</p>
                <div className="mt-4 space-y-3">
                  {activeAssessment.recommendations.slice(0, 3).map((item) => (
                    <div key={item} className="rounded-2xl bg-white/90 p-3 text-sm leading-6 text-slate-700">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5">
                <p className="text-sm font-semibold text-amber-900">Missed concepts</p>
                <div className="mt-4 space-y-3">
                  {(missedConcepts.length ? missedConcepts : ["No major concept gaps in this attempt."]).map((item) => (
                    <div key={item} className="rounded-2xl bg-white/90 p-3 text-sm leading-6 text-slate-700">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="rounded-2xl" onClick={downloadAssessmentReport}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button asChild className="rounded-2xl">
                <a href="/dashboard">
                  Start Interview Practice
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
