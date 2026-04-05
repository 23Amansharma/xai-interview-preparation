"use client";

import React, { useMemo, useState } from "react";
import { Bot, Loader2, MessageSquare, SendHorizonal, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRESET_PROMPTS = [
  "Give me the most important topics for this role before interview.",
  "Ask me 5 likely interview questions for this stack.",
  "Teach me this role in a simple interview-ready way.",
  "How should I answer confidently and accurately?",
];

const buildSessionLabelSafe = (session) => {
  if (!session?.jobPosition) {
    return "General interview preparation";
  }

  return session.jobExperience
    ? `${session.jobPosition} - ${session.jobExperience} yrs`
    : session.jobPosition;
};

const normalizeSessionLabel = (session) => {
  if (!session) {
    return "General interview preparation";
  }

  return `${session.jobPosition}${session.jobExperience ? ` • ${session.jobExperience} yrs` : ""}`;
};

const DashboardPrepCoach = ({
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

  const [selectedOptionId, setSelectedOptionId] = useState(roleOptions[0]?.id || "general");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "I can help you prepare before the interview. Ask about role concepts, tech topics, likely questions, stronger answer strategy, or quick revision plans.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const selectedOption =
    roleOptions.find((option) => option.id === selectedOptionId) || roleOptions[0];

  const askCoach = async (customQuestion) => {
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

  return (
    <section className="mt-8 rounded-[32px] border border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fbff_48%,#f8fafc_100%)] p-6 shadow-sm">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            <Sparkles className="h-4 w-4" />
            Personalized Prep Coach
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-slate-900">
            Learn the role before the interview if you want a stronger performance
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This chatbot uses your target role, stack, and recent dashboard signals to coach you on topics, likely questions, and answer strategy.
          </p>
        </div>

        <div className="w-full max-w-sm rounded-[24px] border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Prep Focus</p>
          <select
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-700">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Quick prep prompts</p>
              <p className="text-xs text-slate-500">Use one of these or ask your own question.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {PRESET_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => askCoach(prompt)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50"
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-[24px] border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Personalized Signals</p>
            <p className="mt-3 text-sm text-amber-900">
              Focus next on: {analytics?.topImprovementAreas?.length ? analytics.topImprovementAreas.join(" ") : "topic fundamentals, structure, and clarity"}.
            </p>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-900 p-3 text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">AI preparation chat</p>
              <p className="text-xs text-slate-500">Ask about topics, frameworks, system design, project storytelling, or mock Q&A.</p>
            </div>
          </div>

          <div className="mt-5 h-[420px] space-y-4 overflow-y-auto rounded-[24px] border border-slate-100 bg-slate-50 p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === "assistant"
                    ? "bg-white text-slate-700 border border-slate-200"
                    : "ml-auto bg-slate-900 text-white"
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

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about your role, tech stack, concepts, or how to answer strongly..."
              disabled={loading}
            />
            <Button
              type="button"
              className="sm:min-w-36"
              onClick={() => askCoach()}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
              <span className="ml-2">Ask Coach</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPrepCoach;
