"use client";

import React, { useEffect, useRef, useState } from 'react'
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import {
  Plus,
  Zap,
  BarChart3,
  MailCheck,
} from "lucide-react";

import AddNewInterview from './_components/AddNewInterview'
import InterviewList from './_components/InterviewList'
import AnalyticsPanel from './_components/AnalyticsPanel';
import { buildDashboardAnalytics } from '@/utils/interview-analytics';

const heroContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const heroItemVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

function Dashboard() {
  const [answerRecords, setAnswerRecords] = useState([]);
  const [interviewSessions, setInterviewSessions] = useState([]);
  const [isNewInterviewModalOpen, setIsNewInterviewModalOpen] = useState(false);
  const [analytics, setAnalytics] = useState(buildDashboardAnalytics([], []));
  const hasFetchedInitialSessionsRef = useRef(false);
  const { user, isLoaded } = useUser();
  const userEmail =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "";
  const userName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.username ||
    "Candidate";

  const fetchInterviews = async () => {
    try {
      const response = await fetch('/api/interviews', {
        method: 'GET'
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch interview data');
      }
  
      const data = await response.json();
      const userSpecificAnswers = Array.isArray(data.userAnswers) ? data.userAnswers : [];
      const userSpecificSessions = Array.isArray(data.interviews) ? data.interviews : [];

      setAnswerRecords(userSpecificAnswers);
      setInterviewSessions(userSpecificSessions);
      setAnalytics(buildDashboardAnalytics(userSpecificAnswers, userSpecificSessions));

    } catch (error) {
      console.error('Error fetching interviews:', error);
      toast.error(error.message || 'Failed to fetch interviews');
    }
  };

  useEffect(() => {
    if (!isLoaded || !userEmail || hasFetchedInitialSessionsRef.current) {
      return;
    }

    hasFetchedInitialSessionsRef.current = true;
    fetchInterviews();
  }, [isLoaded, userEmail]);

  return (
    <div className="w-full px-0 py-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={heroContainerVariants}
        className="dashboard-welcome-card relative overflow-hidden rounded-[36px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,#eef4ff_0%,#ffffff_38%,#f8fafc_100%)] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-6 lg:p-8"
      >
        <div className="dashboard-welcome-glow dashboard-welcome-glow-primary" />
        <div className="dashboard-welcome-glow dashboard-welcome-glow-secondary" />
        <div className="dashboard-welcome-grid" />
        <div className="relative z-10 grid gap-5 xl:grid-cols-[1.55fr_0.45fr] xl:items-start">
          <div>
            <motion.div variants={heroItemVariants} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 shadow-sm backdrop-blur">
              <Zap className="h-4 w-4 text-indigo-600" />
              Welcome Dashboard
            </motion.div>
            <motion.h1 variants={heroItemVariants} className="mt-4 max-w-6xl text-[2.25rem] font-semibold tracking-[-0.05em] text-slate-950 sm:text-[3.05rem] xl:text-[4rem]">
              Welcome back,{" "}
              <span className="bg-[linear-gradient(120deg,#0f172a_0%,#312e81_48%,#0284c7_100%)] bg-clip-text text-transparent">
                {userName}
              </span>
            </motion.h1>
            <motion.p variants={heroItemVariants} className="mt-4 max-w-4xl text-[15px] font-medium leading-8 text-slate-600 sm:text-[16px]">
              Manage interviews, review analytics, continue preparation, and keep every report in one polished workspace built for serious interview practice.
            </motion.p>
            <motion.div variants={heroItemVariants} className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-full border border-indigo-100 bg-white/90 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur">
                Serious mock interviews
              </div>
              <div className="rounded-full border border-emerald-100 bg-emerald-50/90 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm backdrop-blur">
                Live performance signals
              </div>
              <div className="rounded-full border border-sky-100 bg-sky-50/90 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm backdrop-blur">
                Report-ready feedback
              </div>
            </motion.div>
          </div>

          <div className="grid gap-4 xl:grid-cols-1">
            <motion.div variants={heroItemVariants} className="rounded-[28px] border border-emerald-100 bg-[linear-gradient(135deg,#ffffff_0%,#ecfdf5_100%)] p-5 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700">
                <MailCheck className="h-4 w-4" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em]">Auto Reports</p>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Interview summaries can be emailed automatically after completion, giving you a polished performance report after every session.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="mt-6 rounded-[32px] border border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Interview Builder</p>
            <h2 className="mt-2 flex items-center gap-3 text-2xl font-semibold text-gray-800 sm:text-3xl">
              <Zap size={24} className="text-yellow-500" />
              Create AI Mock Interview
            </h2>
          </div>
          <button 
            onClick={() => setIsNewInterviewModalOpen(true)}
            className="flex items-center rounded-full bg-indigo-600 px-5 py-2.5 text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <Plus size={20} className="mr-2" />
            New Interview
          </button>
        </div>

        <div className='grid grid-cols-1 gap-4 xl:grid-cols-4 sm:grid-cols-2'>
          <AddNewInterview 
            isOpen={isNewInterviewModalOpen} 
            onClose={() => setIsNewInterviewModalOpen(false)} 
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[34px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,#eff6ff_0%,#ffffff_42%,#f8fafc_100%)] p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-6 lg:p-7">
        <div className="grid gap-5 xl:grid-cols-[1.55fr_0.88fr] xl:items-stretch">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 shadow-sm">
              <BarChart3 className="h-4 w-4" />
              Performance Command Center
            </div>
            <h2 className="mt-4 max-w-4xl text-[2.5rem] font-semibold tracking-tight text-slate-900 sm:text-[3.4rem]">
              Interview analytics that feel like a real coaching dashboard
            </h2>
            <p className="mt-4 max-w-3xl text-[15px] leading-7 text-slate-600">
              Review session trends, recurring strengths, delivery quality, and automated report coverage from one professional workspace.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Current Focus</p>
              <p className="mt-4 text-base font-medium text-slate-700">
                {analytics?.latestSpeakingProfile?.focus
                  ? `Focus score ${analytics.latestSpeakingProfile.focus}/10`
                  : "Start a session to unlock focus tracking"}
              </p>
              <p className="mt-3 text-sm text-slate-500">
                Live dashboard signals update as you complete more interviews.
              </p>
            </div>
            <div className="rounded-[28px] border border-emerald-100 bg-[linear-gradient(135deg,#ffffff_0%,#ecfdf5_100%)] p-5 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700">
                <BarChart3 className="h-4 w-4" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em]">Sessions</p>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {interviewSessions.length > 0
                  ? `You have ${interviewSessions.length} saved interview session(s) ready for review and follow-up practice.`
                  : "No saved sessions yet. Create your first professional mock interview to begin tracking progress."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <AnalyticsPanel analytics={analytics} />
      </div>
     <div className="mt-8">
        <InterviewList
          interviews={answerRecords}
          sessions={interviewSessions}
          onAddNew={() => setIsNewInterviewModalOpen(true)}
        />
      </div>
    </div>
  );
}

export default Dashboard;
