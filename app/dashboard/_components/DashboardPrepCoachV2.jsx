"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  BrainCircuit,
  Loader2,
  MessageSquare,
  RotateCcw,
  SendHorizonal,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRESET_PROMPTS = [
  "Give me the most important topics for this role before interview.",
  "Ask me 5 likely interview questions for this stack.",
  "Teach me this role in a simple interview-ready way.",
  "How should I answer confidently and accurately?",
];

const defaultWelcomeMessage = {
  role: "assistant",
  content:
    "I can help you prepare before the interview. Ask about role concepts, tech topics, likely questions, stronger answer strategy, or quick revision plans.",
};

const buildSessionLabelSafe = (session) => {
  if (!session?.jobPosition) {
    return "General interview preparation";
  }

  return session.jobExperience
    ? `${session.jobPosition} - ${session.jobExperience} yrs`
    : session.jobPosition;
};

const DashboardPrepCoachV2 = ({
  userName,
  sessions = [],
  analytics,
}) => {
  const roleOptions = useMemo(() => {
    const seen = new Set();
    const options = sessions
      .filter((session) => session?.jobPosition)
      .map((session) => ({
        id: session.mockId,
        label: buildSessionLabelSafe(session),
        role: session.jobPosition,
        stack: session.jobDesc || "",
        experience: session.jobExperience || "",
      }))
      .filter((option) => {
        const key = `${option.role}-${option.stack}-${option.experience}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });

    return [
      {
        id: "general",
        label: "General interview prep",
        role: "General interview preparation",
        stack: "",
        experience: "",
      },
      ...options,
    ];
  }, [sessions]);

  const storageKey = useMemo(
    () => `prep-coach:${userName || "candidate"}`,
    [userName]
  );
  const [selectedOptionId, setSelectedOptionId] = useState(roleOptions[0]?.id || "general");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([defaultWelcomeMessage]);
  const [loading, setLoading] = useState(false);

  const selectedOption =
    roleOptions.find((option) => option.id === selectedOptionId) || roleOptions[0];

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const savedState = window.localStorage.getItem(storageKey);
      if (!savedState) {
        return;
      }

      const parsedState = JSON.parse(savedState);
      if (parsedState?.selectedOptionId) {
        setSelectedOptionId(parsedState.selectedOptionId);
      }
      if (Array.isArray(parsedState?.messages) && parsedState.messages.length > 0) {
        setMessages(parsedState.messages);
      }
    } catch (error) {
      console.error("Failed to restore prep coach state:", error);
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        selectedOptionId,
        messages,
      })
    );
  }, [messages, selectedOptionId, storageKey]);

  const askCoach = async (customQuestion, mode = "coach") => {
    const trimmedQuestion = String(customQuestion || question).trim();
    if (!trimmedQuestion) {
      toast.error("Ask something to start preparation.");
      return;
    }

    const nextMessages = [...messages, { role: "user", content: trimmedQuestion }];
    setMessages(nextMessages);
    setQuestion("");
    setLoading(true);

    try {
      const response = await fetch("/api/dashboard-prep-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          userName,
          question: trimmedQuestion,
          selectedRole: selectedOption?.role,
          selectedStack: selectedOption?.stack,
          selectedExperience: selectedOption?.experience,
          topImprovementAreas: analytics?.topImprovementAreas || [],
          recentStrengths: analytics?.topStrengths || [],
          conversation: nextMessages,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Unable to prepare a response.");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.reply,
        },
      ]);
    } catch (error) {
      console.error("Prep coach error:", error);
      toast.error(error?.message || "Unable to reach the prep coach right now.");
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            "I could not generate the prep guidance right now. Please try again after checking the Gemini API configuration.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startRevisionPlan = () =>
    askCoach(
      `Create a revision plan for ${selectedOption?.role || "my target role"} based on my dashboard signals and likely interview expectations.`,
      "revision_plan"
    );

  const startQuizMode = () =>
    askCoach(
      `Start a realistic interview quiz for ${selectedOption?.role || "my target role"} using ${selectedOption?.stack || "the expected stack"}.`,
      "quiz"
    );

  const clearConversation = () => {
    setMessages([defaultWelcomeMessage]);
    setQuestion("");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
    }
    toast.success("Prep coach conversation cleared.");
  };

  return (
    <motion.section
      id="ai-preparation"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative mt-8 scroll-mt-28 overflow-hidden rounded-[30px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,#eef6ff_0%,#ffffff_52%,#f8fafc_100%)] p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5"
    >
      <div className="prep-coach-glow prep-coach-glow-primary" />
      <div className="prep-coach-glow prep-coach-glow-secondary" />
      <div className="grid gap-4 xl:grid-cols-[1fr_320px] xl:items-center">
        <div className="max-w-none">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4" />
            AI Prep Coach
          </div>
          <h3 className="mt-3 max-w-4xl text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 2xl:text-[2.55rem]">
            Prepare faster before the interview
          </h3>
          <p className="mt-3 max-w-4xl text-sm font-medium leading-7 text-slate-600">
            Ask about likely questions, key topics, frameworks, system design, or stronger answer structure.
          </p>
        </div>

        <div className="w-full rounded-[22px] border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Prep Focus</p>
          <select
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white"
            value={selectedOptionId}
            onChange={(event) => setSelectedOptionId(event.target.value)}
          >
            {roleOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-3 text-xs text-slate-500">
            Current context: {selectedOption?.role || "General interview preparation"}
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-4 grid gap-4 2xl:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)]">
        <div className="rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-700 shadow-sm">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Quick prompts</p>
              <p className="text-xs text-slate-500">Tap one or ask your own.</p>
            </div>
          </div>
          <div className="mt-3 grid gap-2">
            {PRESET_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => askCoach(prompt)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-[12.5px] font-medium leading-5 text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50"
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="mt-3 grid gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={startRevisionPlan}
              disabled={loading}
              className="justify-start rounded-xl border-slate-200 text-sm"
            >
              <BrainCircuit className="mr-2 h-4 w-4" />
              Revision Plan
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={startQuizMode}
              disabled={loading}
              className="justify-start rounded-xl border-slate-200 text-sm"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Quiz Me Now
            </Button>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-900 p-3 text-white shadow-sm">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">AI preparation chat</p>
              <p className="text-xs text-slate-500">Ask about topics, frameworks, system design, project storytelling, or mock Q&A.</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="ml-auto rounded-2xl text-slate-500"
              onClick={clearConversation}
              disabled={loading}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>

          <div className="mt-4 h-[320px] space-y-3 overflow-y-auto rounded-[22px] border border-slate-100 bg-[linear-gradient(180deg,#f8fbff_0%,#f8fafc_100%)] p-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === "assistant"
                    ? "border border-slate-200 bg-white text-slate-700 shadow-sm"
                    : "ml-auto bg-slate-900 text-white shadow-[0_16px_30px_rgba(15,23,42,0.18)]"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
            {loading && (
              <div className="max-w-[92%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparing a focused answer for your role...
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about your role, tech stack, concepts, or how to answer strongly..."
              disabled={loading}
            />
            <Button
              type="button"
              className="sm:min-w-36 rounded-2xl"
              onClick={() => askCoach()}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
              <span className="ml-2">Ask Coach</span>
            </Button>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default DashboardPrepCoachV2;
