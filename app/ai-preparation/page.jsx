"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import {
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import DashboardPrepCoach from "@/app/dashboard/_components/DashboardPrepCoachV2";
import { buildDashboardAnalytics } from "@/utils/interview-analytics";

const heroVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.06,
    },
  },
};

const heroItemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function AIPreparationPage() {
  const [answerRecords, setAnswerRecords] = useState([]);
  const [interviewSessions, setInterviewSessions] = useState([]);
  const [analytics, setAnalytics] = useState(buildDashboardAnalytics([], []));
  const { user, isLoaded } = useUser();

  const userEmail =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "";
  const userName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.username ||
    "Candidate";

  useEffect(() => {
    if (!isLoaded || !userEmail) {
      return;
    }

    const fetchInterviews = async () => {
      try {
        const response = await fetch("/api/interviews", {
          method: "GET",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData?.message || "Failed to fetch interview data");
        }

        const data = await response.json();
        const userSpecificAnswers = Array.isArray(data.userAnswers) ? data.userAnswers : [];
        const userSpecificSessions = Array.isArray(data.interviews) ? data.interviews : [];

        setAnswerRecords(userSpecificAnswers);
        setInterviewSessions(userSpecificSessions);
        setAnalytics(buildDashboardAnalytics(userSpecificAnswers, userSpecificSessions));
      } catch (error) {
        console.error("AI preparation page fetch error:", error);
        toast.error(error?.message || "Failed to load preparation context");
      }
    };

    fetchInterviews();
  }, [isLoaded, userEmail]);

  return (
    <div className="w-full px-0 py-4">
      <motion.section
        initial="hidden"
        animate="visible"
        variants={heroVariants}
        className="prep-hero-card relative overflow-hidden rounded-[36px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,#edf4ff_0%,#ffffff_34%,#f8fafc_100%)] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-6 lg:p-8"
      >
        <div className="prep-hero-glow prep-hero-glow-primary" />
        <div className="prep-hero-glow prep-hero-glow-secondary" />
        <div className="prep-hero-mesh" />
        <div className="relative z-10 grid gap-6 xl:grid-cols-[1.22fr_0.78fr] xl:items-start">
          <div>
            <motion.div
              variants={heroItemVariants}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 shadow-sm backdrop-blur"
            >
              <Sparkles className="h-4 w-4 text-indigo-600" />
              AI Preparation Workspace
            </motion.div>
            <motion.h1
              variants={heroItemVariants}
              className="mt-5 max-w-5xl text-[2.35rem] font-semibold tracking-[-0.055em] text-slate-950 sm:text-[3.1rem] xl:text-[4.2rem]"
            >
              Build sharper answers before the{" "}
              <span className="bg-[linear-gradient(120deg,#0f172a_0%,#312e81_46%,#0284c7_100%)] bg-clip-text text-transparent">
                real interview
              </span>
            </motion.h1>
            <motion.p
              variants={heroItemVariants}
              className="mt-5 max-w-4xl text-[15px] font-medium leading-8 text-slate-600 sm:text-[16px]"
            >
              Use your saved interview history, recurring strengths, and improvement patterns to prepare with focused revision plans, realistic mock prompts, and role-specific coaching.
            </motion.p>
            <motion.div variants={heroItemVariants} className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center gap-2 text-indigo-700">
                  <Target className="h-4 w-4" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">Focused Plans</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Convert dashboard signals into cleaner revision priorities.
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">Role Precision</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Prepare with context from your actual interview history.
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center gap-2 text-sky-700">
                  <ArrowUpRight className="h-4 w-4" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">Faster Improvement</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Turn repeated mistakes into concise prep actions.
                </p>
              </div>
            </motion.div>
          </div>

          <motion.div
            variants={heroItemVariants}
            className="prep-signal-panel rounded-[30px] border border-indigo-100 bg-[linear-gradient(135deg,#ffffff_0%,#eef2ff_100%)] p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 text-indigo-700">
              <BrainCircuit className="h-4 w-4" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em]">Preparation Signals</p>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[24px] bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Saved Sessions</p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <p className="text-4xl font-semibold tracking-tight text-slate-950">{interviewSessions.length}</p>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">Live Context</span>
                </div>
              </div>
              <div className="rounded-[24px] bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Recent Strength Themes</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {analytics?.topStrengths?.length
                    ? analytics.topStrengths.slice(0, 2).join(" • ")
                    : "Complete more interviews to unlock stronger coaching insights."}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <DashboardPrepCoach
        userName={userName}
        sessions={interviewSessions}
        analytics={analytics}
      />

      {answerRecords.length > 0 && (
        <section className="mt-8 rounded-[30px] border border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Preparation Context</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Your recent interview history is connected</h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
            The preparation coach is using your saved sessions, answer patterns, and dashboard insights to make the guidance more role-specific and practical.
          </p>
        </section>
      )}
    </div>
  );
}
