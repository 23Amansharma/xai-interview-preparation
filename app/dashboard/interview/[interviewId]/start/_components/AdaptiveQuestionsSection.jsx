"use client"

import { Clock3, Code2, Lightbulb, Loader2, ShieldAlert, Volume2 } from "lucide-react"
import React, { useEffect } from "react"

const formatTime = (seconds = 0) => {
  const safeSeconds = Math.max(0, seconds)
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`
}

const AdaptiveQuestionsSection = ({
  mockInterviewQuestion,
  activeQuestionIndex,
  proctoringState,
  interviewTerminated,
  isGeneratingQuestion,
  maxQuestions,
  onQuestionSpeechStateChange,
  currentQuestion,
  questionTimeLeft,
  questionTimerExpired,
}) => {
  const textToSpeech = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      const speech = new SpeechSynthesisUtterance(text)
      speech.rate = 0.95
      speech.onstart = () => onQuestionSpeechStateChange?.(true)
      speech.onend = () => onQuestionSpeechStateChange?.(false)
      speech.onerror = () => onQuestionSpeechStateChange?.(false)
      window.speechSynthesis.speak(speech)
    } else {
      onQuestionSpeechStateChange?.(false)
      alert("Sorry, your browser does not support text to speech")
    }
  }

  useEffect(() => {
    const currentQuestionText = mockInterviewQuestion?.[activeQuestionIndex]?.question
    if (!currentQuestionText || interviewTerminated) {
      onQuestionSpeechStateChange?.(false)
      return
    }

    textToSpeech(currentQuestionText)

    return () => {
      onQuestionSpeechStateChange?.(false)
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [activeQuestionIndex, interviewTerminated, mockInterviewQuestion, onQuestionSpeechStateChange])

  const timerWindowLabel =
    currentQuestion?.questionType === "coding"
      ? `${currentQuestion?.difficulty === "easy" ? 8 : currentQuestion?.difficulty === "hard" ? 10 : 9} min coding round`
      : "45 sec quick answer round"

  return mockInterviewQuestion && (
    <div className="my-4 flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max gap-2.5">
          {mockInterviewQuestion.map((question, index) => (
            <h2
              key={question.id || index}
              className={`min-w-[112px] rounded-full px-3.5 py-2 text-center text-xs font-medium md:text-sm ${activeQuestionIndex == index ? "bg-blue-700 text-white shadow-sm" : "bg-slate-100 text-slate-600"}`}
            >
              Question #{index + 1}
            </h2>
          ))}
          {Array.from({ length: Math.max(0, maxQuestions - mockInterviewQuestion.length) }).map((_, index) => (
            <h2 key={`pending-${index}`} className="min-w-[112px] rounded-full bg-slate-100 px-3.5 py-2 text-center text-xs font-medium text-slate-400 md:text-sm">
              Pending
            </h2>
          ))}
        </div>
      </div>

      <div className="mt-4 flex-1 rounded-2xl bg-slate-50 p-4 md:p-5">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Current Question
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {activeQuestionIndex + 1} of {maxQuestions}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <div className={`rounded-2xl border px-4 py-2.5 ${questionTimerExpired ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-800"}`}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                <Clock3 className="h-4 w-4" />
                Timer
              </div>
              <p className="mt-1.5 text-lg font-semibold">{formatTime(questionTimeLeft)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                {currentQuestion?.questionType === "coding" ? <Code2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                Round
              </div>
              <p className="mt-1.5 text-sm font-semibold capitalize">{currentQuestion?.questionType || "theory"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800">
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">Difficulty</p>
              <p className="mt-1.5 text-sm font-semibold capitalize">{currentQuestion?.difficulty || "medium"}</p>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-semibold leading-relaxed text-slate-900 md:text-[2rem]">
          {mockInterviewQuestion[activeQuestionIndex]?.question}
        </h2>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Focus: {currentQuestion?.focusArea || "general"}
          </span>
          <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {timerWindowLabel}
          </span>
          {currentQuestion?.questionType === "coding" && (
            <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Language: {currentQuestion?.codingLanguage || "javascript"}
            </span>
          )}
        </div>

        <button
          type="button"
          className="mt-4 inline-flex items-center gap-2 text-slate-700 transition hover:text-blue-700"
          onClick={() => textToSpeech(mockInterviewQuestion[activeQuestionIndex]?.question)}
        >
          <Volume2 className="h-5 w-5" />
          <span className="text-sm font-medium">Play Question</span>
        </button>
      </div>

      {isGeneratingQuestion && (
        <div className="mt-3 flex items-center gap-2 text-sm text-indigo-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating the next adaptive question from the candidate's last answer...
        </div>
      )}

      <div className="mt-4 w-full rounded-xl border border-blue-200 bg-blue-50 p-3.5">
        <h2 className="flex items-center gap-2 text-sm text-primary">
          <Lightbulb className="h-4 w-4" />
          <strong>Note:</strong>
        </h2>
        <h2 className="mt-1.5 text-xs leading-5 text-primary md:text-sm">
          {currentQuestion?.questionType === "coding"
            ? "Use the coding workspace to write a concise, production-style solution. Mention edge cases and complexity after the code."
            : "Theory rounds are intentionally crisp. Start with your strongest point, keep your structure clean, and answer within the 45-second window."}
        </h2>
      </div>

      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
        <h2 className="flex items-center gap-2 text-amber-700">
          <ShieldAlert />
          <strong>Interview Monitoring</strong>
        </h2>
        <h2 className="my-1.5 text-sm text-amber-800">
          Warnings: {proctoringState?.warningsCount || 0}/3. Monitoring mode:{" "}
          {proctoringState?.visionSupported ? "camera + focus checks active" : "focus-guard fallback active"}.
        </h2>
        {interviewTerminated && (
          <h2 className="text-sm font-semibold text-red-700">
            This interview has been terminated due to repeated monitoring violations.
          </h2>
        )}
      </div>
    </div>
  )
}

export default AdaptiveQuestionsSection
